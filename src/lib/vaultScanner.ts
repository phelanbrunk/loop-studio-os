import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from 'react';

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export interface ObsidianNote {
  id: string;
  title: string;
  content: string;
  frontmatter: Record<string, unknown>;
  tags: string[];
  vaultPath: string;
  createdAt: string;
  updatedAt: string;
}

export interface ObsidianLink {
  id: string;
  sourceNoteId: string;
  targetNoteId: string;
  linkText: string;
  createdAt: string;
}

export interface VaultSyncStatus {
  lastSync: string | null;
  noteCount: number;
  isSyncing: boolean;
  error: string | null;
}

/* ================================================================== */
/*  VAULT SCANNER — Parses .md files from Supabase Bucket              */
/* ================================================================== */

/**
 * Parses YAML frontmatter from markdown content.
 * Looks for content between --- and --- at the start.
 */
function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const yamlText = match[1];
  const body = content.slice(match[0].length);
  const frontmatter: Record<string, unknown> = {};

  // Simple YAML parser — handles key: value and key: [a, b, c] formats
  const lines = yamlText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let value: unknown = trimmed.slice(colonIdx + 1).trim();

    // Try to parse array: [a, b, c]
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      try {
        value = value
          .slice(1, -1)
          .split(',')
          .map(s => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      } catch {
        // keep as string
      }
    }

    // Try to parse number
    if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) {
      value = parseFloat(value);
    }

    // Try to parse boolean
    if (typeof value === 'string' && (value === 'true' || value === 'false')) {
      value = value === 'true';
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

/**
 * Extract tags from content and frontmatter.
 * Obsidian tags are inline: #tag-name
 * Frontmatter tags are in the tags: field
 */
function extractTags(frontmatter: Record<string, unknown>, content: string): string[] {
  const tagSet = new Set<string>();

  // From frontmatter
  const fmTags = frontmatter.tags;
  if (Array.isArray(fmTags)) {
    fmTags.forEach(t => tagSet.add(String(t).toLowerCase()));
  } else if (typeof fmTags === 'string') {
    fmTags.split(/[,\s]+/).forEach(t => tagSet.add(t.toLowerCase()));
  }

  // From inline content (#tag-name)
  const inlineTagRegex = /#([a-zA-Z0-9_-]+)/g;
  let match;
  while ((match = inlineTagRegex.exec(content)) !== null) {
    tagSet.add(match[1].toLowerCase());
  }

  return Array.from(tagSet);
}

/**
 * Extract wiki-style links [[Note Title]] from content.
 */
function extractWikiLinks(content: string): Array<{ title: string; text: string }> {
  const links: Array<{ title: string; text: string }> = [];
  const wikiLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let match;
  while ((match = wikiLinkRegex.exec(content)) !== null) {
    links.push({
      title: match[1].trim(),
      text: match[2]?.trim() || match[1].trim(),
    });
  }
  return links;
}

/**
 * Extract title from filename or frontmatter.
 */
function extractTitle(path: string, frontmatter: Record<string, unknown>): string {
  if (frontmatter.title && typeof frontmatter.title === 'string') {
    return frontmatter.title;
  }
  // From filename (remove .md extension)
  const filename = path.split('/').pop() || '';
  return filename.replace(/\.md$/i, '');
}

/**
 * Parse a single markdown file into an ObsidianNote object.
 */
export function parseVaultFile(path: string, content: string): ObsidianNote {
  const { frontmatter, body } = parseFrontmatter(content);
  const tags = extractTags(frontmatter, body);
  const title = extractTitle(path, frontmatter);

  // Extract created/updated dates from frontmatter or use current date
  const createdAt = frontmatter.created
    ? String(frontmatter.created)
    : frontmatter.date
      ? String(frontmatter.date)
      : new Date().toISOString();

  const updatedAt = frontmatter.updated
    ? String(frontmatter.updated)
    : createdAt;

  return {
    id: '', // Will be set by Supabase
    title,
    content: body,
    frontmatter,
    tags,
    vaultPath: path,
    createdAt,
    updatedAt,
  };
}

/* ================================================================== */
/*  SUPABASE BUCKET SCANNER                                            */
/* ================================================================== */

/**
 * Scan the Supabase Storage bucket for .md files and parse them.
 * Bucket: "Project Loop"
 * Vault path prefix: "Projekt Loop Final Zip"
 */
export async function scanVaultFromBucket(): Promise<ObsidianNote[]> {
  const BUCKET_NAME = 'Project Loop';
  const VAULT_PREFIX = 'Projekt Loop Final Zip';

  try {
    // List all files in the bucket recursively
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(VAULT_PREFIX, { limit: 1000 });

    if (error) throw error;
    if (!files || files.length === 0) {
      console.warn('[vaultScanner] No files found in bucket');
      return [];
    }

    // Filter for .md files and download content
    const mdFiles = files.filter(f => f.name.endsWith('.md'));
    const notes: ObsidianNote[] = [];

    for (const file of mdFiles) {
      const filePath = `${VAULT_PREFIX}/${file.name}`;
      const { data, error: downloadError } = await supabase.storage
        .from(BUCKET_NAME)
        .download(filePath);

      if (downloadError) {
        console.warn(`[vaultScanner] Failed to download ${filePath}:`, downloadError.message);
        continue;
      }

      if (data) {
        const text = await data.text();
        const note = parseVaultFile(filePath, text);
        notes.push(note);
      }
    }

    console.log(`[vaultScanner] Parsed ${notes.length} notes from vault`);
    return notes;
  } catch (e) {
    console.error('[vaultScanner] Scan failed:', e);
    throw e;
  }
}

/**
 * Upsert parsed notes into the obsidian_notes table.
 */
export async function syncNotesToDatabase(notes: ObsidianNote[]): Promise<number> {
  const upsertData = notes.map(note => ({
    title: note.title,
    content: note.content,
    frontmatter: note.frontmatter,
    tags: note.tags,
    vault_path: note.vaultPath,
  }));

  const { error } = await supabase
    .from('obsidian_notes')
    .upsert(upsertData, { onConflict: 'vault_path' });

  if (error) {
    console.error('[vaultScanner] Upsert failed:', error.message);
    throw error;
  }

  return notes.length;
}

/**
 * Full sync: scan bucket → parse → upsert to DB → return status.
 */
export async function fullVaultSync(): Promise<{ notes: ObsidianNote[]; count: number }> {
  const notes = await scanVaultFromBucket();
  const count = await syncNotesToDatabase(notes);
  return { notes, count };
}

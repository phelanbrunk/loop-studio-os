import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Tag,
  Clock,
  FileText,
  ArrowLeft,
  GitGraph,
  Filter,
  ChevronDown,
  BookOpen,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

/* ================================================================== */
/*  TYPES (mirrored from hooks)                                        */
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

interface ObsidianVaultProps {
  onShowInGraph?: (noteId: string) => void;
}

/* ================================================================== */
/*  MOCK DATA — replaced by real Supabase data later                   */
/* ================================================================== */

const MOCK_NOTES: ObsidianNote[] = [
  {
    id: 'note-1',
    title: 'Projektideen 2026',
    content: '# Projektideen 2026\n\n## Balzereit Gartenpflege\n- Landing Page mit 3D Elementen\n- Kontaktformular mit Kalenderintegration\n\n## IGZ Wernigerode\n- 3D Schulungsplattform\n- Immobilienscanner\n\n## Spindler Berlin\n- Corporate Website\n- SEO Optimierung\n\n---\n\nTags: #projekte #ideen #2026',
    frontmatter: { tags: ['projekte', 'ideen', '2026'], created: '2026-01-15' },
    tags: ['projekte', 'ideen', '2026'],
    vaultPath: 'Projekte/Projektideen 2026.md',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-20T14:30:00Z',
  },
  {
    id: 'note-2',
    title: 'Design System v2 Spezifikation',
    content: '# Design System v2\n\n## Farben\n- Primary: #FF8C5A\n- Secondary: #36CFC9\n- Background: #0C0D0F\n\n## Typografie\n- UI: DM Sans\n- Code/Labels: IBM Plex Mono\n\n## Komponenten\n- Button\n- Card\n- Input\n- Select\n\n---\n\nTags: #design #system #spezifikation',
    frontmatter: { tags: ['design', 'system', 'spezifikation'], version: '2.0' },
    tags: ['design', 'system', 'spezifikation'],
    vaultPath: 'Design/Design System v2.md',
    createdAt: '2025-12-01T09:00:00Z',
    updatedAt: '2026-01-25T11:00:00Z',
  },
  {
    id: 'note-3',
    title: 'Kundenkommunikation — Balzereit',
    content: '# Kundenkommunikation — Balzereit\n\n## Ansprechpartner\n- Herr Balzereit\n- E-Mail: info@balzereit.de\n\n## Wichtige Punkte\n1. Gartenpflege im Fokus\n2. Saisonale Angebote\n3. Online-Terminbuchung\n\n## Meeting-Notizen (15.01.2026)\n- Farbschema: Grün/Natürlich\n- Zielgruppe: Privatkunden 30-60\n\n---\n\nTags: #kunden #balzereit #kommunikation',
    frontmatter: { tags: ['kunden', 'balzereit', 'kommunikation'], customer: 'Balzereit' },
    tags: ['kunden', 'balzereit', 'kommunikation'],
    vaultPath: 'Kunden/Balzereit/Kundenkommunikation.md',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-18T16:00:00Z',
  },
  {
    id: 'note-4',
    title: 'Tech Stack Loop Studio OS',
    content: '# Tech Stack\n\n## Frontend\n- React 19\n- TypeScript\n- Tailwind CSS\n- Vite\n- Framer Motion\n\n## Backend\n- Supabase (Postgres)\n- Edge Functions\n- Realtime\n\n## AI/ML\n- OpenAI API\n- Anthropic Claude\n- Grok (xAI)\n\n## Deployment\n- Vercel\n\n---\n\nTags: #tech #stack #architektur',
    frontmatter: { tags: ['tech', 'stack', 'architektur'] },
    tags: ['tech', 'stack', 'architektur'],
    vaultPath: 'Tech/Tech Stack.md',
    createdAt: '2025-11-20T10:00:00Z',
    updatedAt: '2026-01-22T09:00:00Z',
  },
  {
    id: 'note-5',
    title: 'Preisliste Webdesign 2026',
    content: '# Preisliste Webdesign 2026\n\n## Pakete\n\n### Starter (1.500€)\n- Einseitige Website\n- Responsive Design\n- Kontaktformular\n\n### Business (3.500€)\n- Multi-Page Website\n- CMS Integration\n- SEO Basis\n\n### Premium (7.500€+)\n- Custom Webapp\n- API Integration\n- AI Features\n\n---\n\nTags: #preise #angebote #2026',
    frontmatter: { tags: ['preise', 'angebote', '2026'], year: 2026 },
    tags: ['preise', 'angebote', '2026'],
    vaultPath: 'Business/Preisliste 2026.md',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

/* ================================================================== */
/*  SIMPLE MARKDOWN RENDERER                                           */
/* ================================================================== */

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = '';
  let codeLang = '';

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="bg-[#141518] border border-white/[0.06] rounded-lg p-3 overflow-x-auto my-3">
            <code className="text-xs font-mono text-[#A1A4AA]">{codeContent}</code>
          </pre>
        );
        codeContent = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeContent += line + '\n';
      return;
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={`hr-${i}`} className="border-white/[0.06] my-4" />);
      return;
    }

    // Headers
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-lg font-semibold text-white mt-4 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          {parseInline(trimmed.slice(2))}
        </h1>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-base font-semibold text-[#E8E9EC] mt-3 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          {parseInline(trimmed.slice(3))}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-sm font-medium text-[#A1A4AA] mt-2 mb-1.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          {parseInline(trimmed.slice(4))}
        </h3>
      );
      return;
    }

    // Lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <li key={`li-${i}`} className="text-sm text-[#A1A4AA] ml-4 list-disc marker:text-[#5E626A]">
          {parseInline(trimmed.slice(2))}
        </li>
      );
      return;
    }
    if (/^\d+\.\s/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s/, '');
      elements.push(
        <li key={`oli-${i}`} className="text-sm text-[#A1A4AA] ml-4 list-decimal marker:text-[#5E626A]">
          {parseInline(text)}
        </li>
      );
      return;
    }

    // Empty line
    if (!trimmed) {
      elements.push(<div key={`br-${i}`} className="h-2" />);
      return;
    }

    // Normal paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm text-[#A1A4AA] leading-relaxed">
        {parseInline(trimmed)}
      </p>
    );
  });

  return <div className="space-y-0.5">{elements}</div>;
}

function parseInline(text: string): React.ReactNode {
  // Very simple inline parsing for bold, italic, code, links
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Inline code
  const codeRegex = /`([^`]+)`/g;
  let match;
  let lastIndex = 0;

  while ((match = codeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...parseBoldItalic(text.slice(lastIndex, match.index), key++));
    }
    parts.push(
      <code key={`code-${key++}`} className="bg-[#141518] border border-white/[0.06] rounded px-1 py-0.5 text-xs font-mono text-[#36CFC9]">
        {match[1]}
      </code>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(...parseBoldItalic(text.slice(lastIndex), key++));
  }

  if (parts.length === 0) {
    return text;
  }
  return <>{parts}</>;
}

function parseBoldItalic(text: string, baseKey: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = baseKey;

  // Bold
  const boldRegex = /\*\*([^*]+)\*\*|__([^_]+)__/g;
  let match;
  let lastIndex = 0;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...parseItalic(text.slice(lastIndex, match.index), key++));
    }
    parts.push(<strong key={`bold-${key++}`} className="text-white font-medium">{match[1] || match[2]}</strong>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(...parseItalic(text.slice(lastIndex), key++));
  }

  if (parts.length === 0) {
    return [text];
  }
  return parts;
}

function parseItalic(text: string, baseKey: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const italicRegex = /\*([^*]+)\*|_([^_]+)_/g;
  let match;
  let lastIndex = 0;

  while ((match = italicRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<em key={`italic-${baseKey++}`} className="text-[#E8E9EC]">{match[1] || match[2]}</em>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  if (parts.length === 0) {
    return [text];
  }
  return parts;
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export function ObsidianVault({ onShowInGraph }: ObsidianVaultProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedNote, setSelectedNote] = useState<ObsidianNote | null>(null);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    MOCK_NOTES.forEach(note => note.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, []);

  // Filter notes
  const filteredNotes = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return MOCK_NOTES.filter(note => {
      const matchesSearch =
        !searchQuery ||
        note.title.toLowerCase().includes(lowerQuery) ||
        note.content.toLowerCase().includes(lowerQuery) ||
        note.tags.some(t => t.toLowerCase().includes(lowerQuery));
      const matchesTag = selectedTag === 'all' || note.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [searchQuery, selectedTag]);

  const handleSync = useCallback(() => {
    setSyncStatus('syncing');
    // Simulate sync — in production this calls vaultScanner
    setTimeout(() => setSyncStatus('done'), 1500);
    setTimeout(() => setSyncStatus('idle'), 3000);
  }, []);

  // ── DETAIL VIEW ──
  if (selectedNote) {
    return (
      <div className="h-full flex flex-col bg-[#0C0D0F] border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Detail Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <button
            onClick={() => setSelectedNote(null)}
            className="flex items-center gap-2 text-[#A1A4AA] hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Liste
          </button>
          <div className="flex items-center gap-2">
            {onShowInGraph && (
              <button
                onClick={() => onShowInGraph(selectedNote.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FF8C5A]/10 text-[#FF8C5A] hover:bg-[#FF8C5A]/20 transition-colors border border-[#FF8C5A]/20"
              >
                <GitGraph className="w-3.5 h-3.5" />
                In Graph anzeigen
              </button>
            )}
          </div>
        </div>

        {/* Detail Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Title */}
          <h1 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {selectedNote.title}
          </h1>

          {/* Meta info */}
          <div className="flex items-center gap-4 mb-6 text-xs text-[#5E626A]">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {selectedNote.vaultPath}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {new Date(selectedNote.updatedAt).toLocaleDateString('de-DE')}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedNote.tags.map(tag => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-xs font-medium border border-white/[0.08] text-[#36CFC9] bg-[#36CFC9]/8"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Frontmatter (if any beyond tags) */}
          {Object.keys(selectedNote.frontmatter).length > 1 && (
            <div className="mb-6 p-3 bg-[#141518] border border-white/[0.06] rounded-lg">
              <h3 className="text-xs font-medium text-[#5E626A] uppercase tracking-wider mb-2">Frontmatter</h3>
              <div className="space-y-1">
                {Object.entries(selectedNote.frontmatter)
                  .filter(([k]) => k !== 'tags')
                  .map(([key, value]) => (
                    <div key={key} className="flex gap-2 text-xs">
                      <span className="text-[#5E626A] font-mono">{key}:</span>
                      <span className="text-[#A1A4AA]">{String(value)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Markdown Content */}
          <div className="prose prose-invert prose-sm max-w-none">
            <MarkdownRenderer content={selectedNote.content} />
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="h-full flex flex-col bg-[#0C0D0F] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-white/[0.06]">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 bg-[#141518] border border-white/[0.06] rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-[#5E626A]" />
          <input
            type="text"
            placeholder="Notes durchsuchen..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-white placeholder-[#5E626A] outline-none w-full"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#5E626A] hover:text-white transition-colors">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Tag Filter */}
        <div className="relative">
          <button
            onClick={() => setShowTagFilter(v => !v)}
            className="flex items-center gap-1.5 bg-[#141518] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-[#A1A4AA] hover:text-white hover:border-white/[0.12] transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Tags</span>
            {selectedTag !== 'all' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#36CFC9]" />
            )}
            <ChevronDown className="w-3 h-3" />
          </button>
          <AnimatePresence>
            {showTagFilter && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full mt-1 right-0 bg-[#141518] border border-white/[0.06] rounded-xl shadow-xl py-1 min-w-[180px] max-h-60 overflow-y-auto z-10"
              >
                <button
                  onClick={() => { setSelectedTag('all'); setShowTagFilter(false); }}
                  className={`w-full text-left px-3 py-1.5 text-sm ${selectedTag === 'all' ? 'text-white bg-white/[0.06]' : 'text-[#A1A4AA] hover:text-white hover:bg-white/[0.04]'} transition-colors`}
                >
                  Alle Tags
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => { setSelectedTag(tag); setShowTagFilter(false); }}
                    className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
                      selectedTag === tag ? 'text-[#36CFC9] bg-[#36CFC9]/8' : 'text-[#A1A4AA] hover:text-white hover:bg-white/[0.04]'
                    } transition-colors`}
                  >
                    <Tag className="w-3 h-3" />
                    #{tag}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sync Button */}
        <button
          onClick={handleSync}
          disabled={syncStatus === 'syncing'}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors border border-white/[0.06] hover:border-white/[0.12]"
          style={{
            color: syncStatus === 'done' ? '#4ADE80' : syncStatus === 'error' ? '#EF4444' : '#A1A4AA',
            backgroundColor: syncStatus === 'done' ? 'rgba(74,222,128,0.08)' : syncStatus === 'error' ? 'rgba(239,68,68,0.08)' : 'transparent',
          }}
        >
          {syncStatus === 'syncing' ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : syncStatus === 'done' ? (
            <AlertCircle className="w-4 h-4" />
          ) : syncStatus === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {syncStatus === 'syncing' ? 'Sync...' : syncStatus === 'done' ? 'Fertig' : syncStatus === 'error' ? 'Fehler' : 'Sync'}
        </button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[1fr_140px_100px_80px] gap-4 px-4 py-2 border-b border-white/[0.04] text-xs text-[#5E626A] uppercase tracking-wider font-medium">
        <span>Titel</span>
        <span>Tags</span>
        <span>Pfad</span>
        <span className="text-right">Aktualisiert</span>
      </div>

      {/* Note List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-[#5E626A]">
            <BookOpen className="w-8 h-8 mb-3 opacity-40" />
            <p className="text-sm">Keine Notes gefunden</p>
            <p className="text-xs mt-1">Passe deine Suche oder Filter an</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredNotes.map(note => (
              <button
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className="w-full grid grid-cols-[1fr_140px_100px_80px] gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left group"
              >
                {/* Title */}
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate group-hover:text-[#FF8C5A] transition-colors">
                    {note.title}
                  </p>
                  <p className="text-xs text-[#5E626A] truncate mt-0.5">
                    {note.content.slice(0, 80).replace(/[#*_`]/g, '')}...
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 content-center">
                  {note.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] text-[#A1A4AA] border border-white/[0.04]"
                    >
                      #{tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] text-[#5E626A]">
                      +{note.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Path */}
                <div className="flex items-center">
                  <span className="text-xs text-[#5E626A] truncate font-mono">
                    {note.vaultPath.split('/').slice(0, -1).join('/') || 'Root'}
                  </span>
                </div>

                {/* Date */}
                <div className="flex items-center justify-end">
                  <span className="text-xs text-[#5E626A]">
                    {new Date(note.updatedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/[0.04] text-xs text-[#5E626A]">
        <span className="text-[#A1A4AA] font-medium">{filteredNotes.length}</span> von{' '}
        <span className="text-[#A1A4AA] font-medium">{MOCK_NOTES.length}</span> Notes
        {selectedTag !== 'all' && (
          <span className="ml-2 text-[#36CFC9]">• Filter: #{selectedTag}</span>
        )}
      </div>
    </div>
  );
}

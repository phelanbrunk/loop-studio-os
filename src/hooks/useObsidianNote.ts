import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ObsidianNote } from '@/lib/vaultScanner';

/**
 * Hook: Load a single Obsidian Note by ID from Supabase.
 */
export function useObsidianNote(noteId: string | null) {
  const [note, setNote] = useState<ObsidianNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNote = useCallback(async () => {
    if (!noteId) {
      setNote(null);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('obsidian_notes')
      .select('*')
      .eq('id', noteId)
      .single();

    if (err) {
      setError(err.message);
      setNote(null);
    } else if (data) {
      setNote({
        id: data.id,
        title: data.title,
        content: data.content || '',
        frontmatter: data.frontmatter || {},
        tags: data.tags || [],
        vaultPath: data.vault_path || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
    }

    setLoading(false);
  }, [noteId]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  return { note, loading, error, refetch: fetchNote };
}

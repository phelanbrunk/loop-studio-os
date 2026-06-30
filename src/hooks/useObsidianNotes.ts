import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ObsidianNote } from '@/lib/vaultScanner';

/**
 * Hook: Load all Obsidian Notes from Supabase.
 * Subscribes to realtime changes on the obsidian_notes table.
 */
export function useObsidianNotes() {
  const [notes, setNotes] = useState<ObsidianNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('obsidian_notes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (err) {
      setError(err.message);
      setNotes([]);
    } else {
      const mapped: ObsidianNote[] = (data || []).map(row => ({
        id: row.id,
        title: row.title,
        content: row.content || '',
        frontmatter: row.frontmatter || {},
        tags: row.tags || [],
        vaultPath: row.vault_path || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
      setNotes(mapped);
    }

    setLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('obsidian_notes_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'obsidian_notes' },
        () => {
          // Refresh on any change
          fetchNotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotes]);

  return { notes, loading, error, refetch: fetchNotes };
}

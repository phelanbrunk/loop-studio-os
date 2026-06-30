import { useState, useCallback } from 'react';
import { fullVaultSync } from '@/lib/vaultScanner';
import { supabase } from '@/lib/supabase';

export interface VaultSyncState {
  status: 'idle' | 'syncing' | 'done' | 'error';
  lastSync: string | null;
  noteCount: number;
  error: string | null;
}

/**
 * Hook: Manage vault sync state between Supabase Storage bucket and DB.
 */
export function useVaultSync() {
  const [state, setState] = useState<VaultSyncState>({
    status: 'idle',
    lastSync: null,
    noteCount: 0,
    error: null,
  });

  const sync = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'syncing', error: null }));

    try {
      const { notes, count } = await fullVaultSync();
      setState({
        status: 'done',
        lastSync: new Date().toISOString(),
        noteCount: count,
        error: null,
      });
      return notes;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sync failed';
      setState(prev => ({
        ...prev,
        status: 'error',
        error: message,
      }));
      throw e;
    }
  }, []);

  const getLastSyncInfo = useCallback(async () => {
    // Check the most recent note's updated_at to infer last sync
    const { data, error } = await supabase
      .from('obsidian_notes')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      setState(prev => ({
        ...prev,
        lastSync: data[0].updated_at,
      }));
    }

    // Count total notes
    const { count } = await supabase
      .from('obsidian_notes')
      .select('*', { count: 'exact', head: true });

    if (count !== null) {
      setState(prev => ({ ...prev, noteCount: count }));
    }
  }, []);

  return {
    ...state,
    sync,
    getLastSyncInfo,
  };
}

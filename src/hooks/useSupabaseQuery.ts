import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useSupabaseQuery<T>(table: string, options?: {
  select?: string;
  order?: { column: string; ascending?: boolean };
}) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase.from(table).select(options?.select || '*');
    if (options?.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
    }
    const { data: result, error: err } = await query;
    if (err) setError(err.message);
    else setData((result as T[]) || []);
    setLoading(false);
  }, [table, JSON.stringify(options)]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

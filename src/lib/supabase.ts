import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient;

try {
  if (supabaseUrl && supabaseKey && supabaseUrl !== 'undefined') {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  } else {
    console.warn('[Supabase] Missing URL or Key. Auth features will be limited.');
    supabase = createClient('http://placeholder.supabase.co', 'placeholder-key');
  }
} catch (e) {
  console.error('[Supabase] Init failed:', e);
  supabase = createClient('http://placeholder.supabase.co', 'placeholder-key');
}

export { supabase };

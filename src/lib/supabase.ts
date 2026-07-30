import { createBrowserClient } from '@supabase/ssr';

/**
 * Vite Supabase Client Utility
 * Strictly uses import.meta.env.VITE_SUPABASE_URL and import.meta.env.VITE_SUPABASE_ANON_KEY.
 * Hard-fails with a clear error if environment variables are missing.
 */

export function createClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase Environment Variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.');
  }

  return createBrowserClient(url, anonKey);
}

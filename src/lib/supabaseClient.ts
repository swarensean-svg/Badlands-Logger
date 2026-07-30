import { createBrowserClient } from '@supabase/ssr';

/**
 * Next.js Supabase Browser Client Utility
 * Creates a Supabase client for Client Components.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo-gym-app.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbW8iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3MjUxMjAwMCwiZXhwIjoyOTg4MDg4MDAwfQ.demo_key_hash';

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

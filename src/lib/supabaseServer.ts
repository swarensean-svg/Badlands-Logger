import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Next.js Supabase Server Client Utility
 * Creates an authenticated Supabase client for Server Components, Server Actions, and Route Handlers.
 * Uses HTTP-only cookies for safe SSR JWT session management.
 */

// Fallback credentials for preview environment or when environment variables are not set
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo-gym-app.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbW8iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3MjUxMjAwMCwiZXhwIjoyOTg4MDg4MDAwfQ.demo_key_hash';

export function createClient(cookieStore?: {
  get: (name: string) => { value: string } | undefined;
  set?: (name: string, value: string, options: CookieOptions) => void;
  remove?: (name: string, options: CookieOptions) => void;
}) {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore?.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore?.set?.(name, value, options);
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore?.set?.(name, '', { ...options, maxAge: 0 });
        } catch {
          // The `remove` method was called from a Server Component.
        }
      },
    },
  });
}

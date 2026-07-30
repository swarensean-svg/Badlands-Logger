import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Next.js Supabase Server Client Utility
 * Creates an authenticated Supabase client for Server Components, Server Actions, and Route Handlers.
 * Uses HTTP-only cookies for safe SSR JWT session management.
 * Strictly uses process.env.NEXT_PUBLIC_SUPABASE_URL and process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */

export function createClient(cookieStore?: {
  get: (name: string) => { value: string } | undefined;
  set?: (name: string, value: string, options: CookieOptions) => void;
  remove?: (name: string, options: CookieOptions) => void;
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase Environment Variables');
  }

  return createServerClient(url, anonKey, {
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

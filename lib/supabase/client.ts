import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client dùng ở phía browser (Client Components).
 * Chỉ dùng anon key - an toàn để expose ra client.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

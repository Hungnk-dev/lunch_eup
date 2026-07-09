import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Supabase client dùng ở phía server (Server Components, Server Actions).
 * Đọc session từ cookies - mọi query đều chạy dưới quyền của user hiện tại,
 * RLS policy sẽ quyết định được đọc/ghi gì. Không dùng service role key.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll được gọi từ Server Component - có thể bỏ qua
            // vì middleware sẽ lo việc refresh session.
          }
        },
      },
    }
  );
}

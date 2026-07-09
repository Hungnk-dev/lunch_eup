import { type ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getGroup } from "@/lib/data";
import { Nav } from "./Nav";

/**
 * Khung chung của app: header (tên nhóm vui) + bottom nav trên mobile.
 * Server component - tự fetch trạng thái đăng nhập & thông tin nhóm.
 */
export async function AppShell({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    group,
  ] = await Promise.all([supabase.auth.getUser(), getGroup()]);

  return (
    <div className="min-h-dvh">
      <Nav
        isAdmin={!!user}
        funHeader={group?.fun_header ?? group?.name ?? "Cơm Chung"}
      />
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 md:pb-10">
        {children}
      </main>
    </div>
  );
}

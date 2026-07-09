"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/app/actions";

interface NavItem {
  href: string;
  label: string;
  emoji: string;
  adminOnly?: boolean;
  /** Bottom nav mobile chỉ chứa 5 item cho đỡ chật - item này chỉ hiện ở desktop */
  desktopOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Trang chủ", emoji: "🏠", adminOnly: true },
  { href: "/foods", label: "Món ăn", emoji: "🎲", adminOnly: true, desktopOnly: true },
  { href: "/meals", label: "Bữa ăn", emoji: "🍜" },
  { href: "/debts", label: "Công nợ", emoji: "💰" },
  { href: "/payments", label: "Thanh toán", emoji: "💸", adminOnly: true },
  { href: "/members", label: "Thành viên", emoji: "👥", adminOnly: true },
];

export function Nav({
  isAdmin,
  funHeader,
}: {
  isAdmin: boolean;
  funHeader: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV_ITEMS.filter((i) => isAdmin || !i.adminOnly);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-rice-200/60 bg-rice-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href={isAdmin ? "/" : "/debts"}
            className="truncate text-lg font-extrabold text-rice-700"
          >
            🍚 {funHeader}
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            {/* Nav ngang cho desktop */}
            <nav className="mr-2 hidden items-center gap-1 md:flex">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    isActive(item.href)
                      ? "bg-rice-200 text-rice-800"
                      : "text-stone-500 hover:bg-rice-100"
                  }`}
                >
                  {item.emoji} {item.label}
                </Link>
              ))}
            </nav>
            {isAdmin ? (
              <>
                <Link
                  href="/settings"
                  aria-label="Cài đặt nhóm"
                  className={`rounded-lg px-2 py-1.5 text-lg transition-colors hover:bg-rice-100 ${
                    isActive("/settings") ? "bg-rice-200" : ""
                  }`}
                >
                  ⚙️
                </Link>
                <button
                  onClick={async () => {
                    await signOut();
                    router.push("/login");
                    router.refresh();
                  }}
                  className="rounded-lg px-2 py-1.5 text-sm font-semibold text-stone-500 hover:bg-rice-100"
                >
                  Thoát
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-rice-700 hover:bg-rice-100"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Bottom nav cho mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-rice-200/60 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-3xl items-stretch justify-around">
          {items.filter((i) => !i.desktopOnly).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
                isActive(item.href) ? "text-rice-600" : "text-stone-400"
              }`}
            >
              <span className="text-xl" aria-hidden>
                {item.emoji}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

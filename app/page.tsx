import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getGroup, getDebtRawData } from "@/lib/data";
import { computeDebts, totalOutstanding } from "@/lib/debt";
import { formatVND } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  { href: "/foods", emoji: "🎲", label: "Hôm nay ăn gì?", primary: true, wide: true },
  { href: "/meals/new", emoji: "🍜", label: "Tạo bữa ăn hôm nay", primary: true },
  { href: "/debts", emoji: "💰", label: "Xem công nợ" },
  { href: "/payments/new", emoji: "💸", label: "Ghi nhận thanh toán" },
  { href: "/members", emoji: "👥", label: "Quản lý thành viên" },
];

export default async function DashboardPage() {
  const group = await getGroup();

  if (!group) {
    return (
      <AppShell>
        <EmptyState
          emoji="🏗️"
          title="Chưa có nhóm nào"
          description="Hãy chạy file SQL migration trong Supabase để tạo nhóm mặc định nhé (xem README)."
        />
      </AppShell>
    );
  }

  const supabase = await createClient();
  const [{ members, participants, payments }, mealCountRes] = await Promise.all([
    getDebtRawData(group.id),
    supabase
      .from("meal_sessions")
      .select("id", { count: "exact", head: true })
      .eq("group_id", group.id),
  ]);

  const debts = computeDebts(members, participants, payments);
  const outstanding = totalOutstanding(debts);
  const activeCount = members.filter((m) => m.is_active).length;
  const mealCount = mealCountRes.count ?? 0;
  const topDebtor = debts.find((d) => d.balance > 0);

  const stats = [
    { emoji: "👥", label: "Thành viên", value: String(activeCount) },
    { emoji: "🍱", label: "Bữa đã ghi", value: String(mealCount) },
    { emoji: "🧾", label: "Còn phải thu", value: formatVND(outstanding) },
    {
      emoji: "🏆",
      label: "Nợ nhiều nhất",
      value: topDebtor
        ? `${topDebtor.member.name} (${formatVND(topDebtor.balance)})`
        : "Không ai cả 🎉",
    },
  ];

  return (
    <AppShell>
      {/* Header vui của nhóm */}
      <div className="mb-6 rounded-3xl bg-gradient-to-br from-rice-400 to-rice-600 p-6 text-white shadow-lg shadow-rice-500/30">
        <p className="text-sm font-medium opacity-90">Xin chào admin 👋</p>
        <h1 className="mt-1 text-3xl font-extrabold leading-tight">
          {group.fun_header ?? group.name}
        </h1>
        <p className="mt-2 text-sm opacity-90">
          {outstanding > 0
            ? `Cả nhóm còn nợ ${formatVND(outstanding)} — nhắc nhẹ thôi! 😄`
            : "Sổ sách sạch bong, không ai nợ ai! 🎉"}
        </p>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-semibold text-stone-400">
              {s.emoji} {s.label}
            </p>
            <p className="mt-1 truncate text-lg font-extrabold text-stone-800">
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Nút nhanh */}
      <h2 className="mb-3 mt-7 text-sm font-bold uppercase tracking-wide text-stone-400">
        Thao tác nhanh
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {QUICK_ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`flex flex-col items-start gap-2 rounded-2xl p-4 font-bold shadow-sm transition-transform active:scale-[0.98] ${
              "wide" in a && a.wide ? "col-span-2" : ""
            } ${
              a.primary
                ? "bg-rice-500 text-white shadow-rice-500/30 hover:bg-rice-600"
                : "bg-white text-stone-700 ring-1 ring-black/5 hover:bg-rice-50"
            }`}
          >
            <span className="text-2xl" aria-hidden>
              {a.emoji}
            </span>
            <span className="text-sm">{a.label}</span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

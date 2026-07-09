"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Member, MemberMealRow, Payment } from "@/types";
import { formatVND, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

type Tab = "meals" | "payments" | "timeline";

const TABS: { key: Tab; label: string }[] = [
  { key: "meals", label: "🍜 Bữa đã ăn" },
  { key: "payments", label: "💸 Thanh toán" },
  { key: "timeline", label: "📅 Dòng thời gian" },
];

/** Một dòng trong timeline: bữa ăn (+tiền nợ) hoặc thanh toán (-tiền nợ) */
interface TimelineRow {
  key: string;
  date: string;
  label: string;
  delta: number; // + là thêm nợ, - là trả bớt
  runningBalance: number;
}

export function MemberDebtDetail({
  member,
  meals,
  payments,
  isAdmin,
}: {
  member: Member;
  meals: MemberMealRow[];
  payments: Payment[];
  isAdmin: boolean;
}) {
  const [tab, setTab] = useState<Tab>("meals");

  const totalDue = meals.reduce((sum, m) => sum + m.amountDue, 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = totalDue - totalPaid;

  // Timeline: gộp bữa ăn + thanh toán, xếp theo ngày tăng dần,
  // cộng dồn số dư tạm tính sau mỗi dòng.
  const timeline = useMemo<TimelineRow[]>(() => {
    const rows = [
      ...meals.map((m) => ({
        key: `meal-${m.sessionId}`,
        date: m.date,
        label: m.foodName ?? "Bữa ăn",
        delta: m.amountDue,
      })),
      ...payments.map((p) => ({
        key: `payment-${p.id}`,
        date: p.paid_at,
        label: p.note ? `Thanh toán (${p.note})` : "Thanh toán",
        delta: -Number(p.amount),
      })),
    ].sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        // cùng ngày: bữa ăn đứng trước thanh toán
        (a.delta > 0 && b.delta < 0 ? -1 : a.delta < 0 && b.delta > 0 ? 1 : 0)
    );

    let running = 0;
    return rows.map((r) => {
      running += r.delta;
      return { ...r, runningBalance: running };
    });
  }, [meals, payments]);

  return (
    <div className="space-y-4">
      <Link
        href="/debts"
        className="inline-block text-sm font-semibold text-rice-600 hover:underline"
      >
        ← Quay lại bảng công nợ
      </Link>

      {/* Header tổng hợp */}
      <Card className="bg-gradient-to-br from-rice-400 to-rice-600 p-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-extrabold">👤 {member.name}</p>
            {!member.is_active && (
              <p className="mt-1 text-xs opacity-80">(thành viên đã ẩn)</p>
            )}
          </div>
          <div className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold">
            {balance > 0
              ? `Còn nợ ${formatVND(balance)}`
              : balance === 0
                ? "Sạch nợ 🎉"
                : `Đang trả dư ${formatVND(Math.abs(balance))}`}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/15 py-2">
            <p className="text-xs opacity-80">Tổng đã ăn</p>
            <p className="font-extrabold">{formatVND(totalDue)}</p>
          </div>
          <div className="rounded-xl bg-white/15 py-2">
            <p className="text-xs opacity-80">Đã thanh toán</p>
            <p className="font-extrabold">{formatVND(totalPaid)}</p>
          </div>
          <div className="rounded-xl bg-white/15 py-2">
            <p className="text-xs opacity-80">Còn nợ</p>
            <p className="font-extrabold">{formatVND(Math.max(balance, 0))}</p>
          </div>
        </div>
        {isAdmin && (
          <Link
            href="/payments/new"
            className="mt-4 block rounded-xl bg-white py-2.5 text-center text-sm font-bold text-rice-700 transition-colors hover:bg-rice-100"
          >
            💸 Ghi nhận thanh toán
          </Link>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-rice-500 text-white"
                : "bg-white text-stone-500 ring-1 ring-stone-200 hover:bg-rice-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Bữa đã ăn */}
      {tab === "meals" &&
        (meals.length === 0 ? (
          <EmptyState emoji="🍱" title="Chưa có bữa ăn nào 🍱" />
        ) : (
          <div className="space-y-2">
            {meals.map((m) => (
              <Link
                key={m.sessionId}
                href={`/meals/${m.sessionId}`}
                className="block"
              >
                <Card className="p-4 transition-colors hover:bg-rice-50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-stone-800">
                        📅 {formatDate(m.date)}
                        <span className="ml-2 font-semibold text-stone-500">
                          {m.foodName ?? "Bữa ăn"}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-sm text-stone-400">
                        Tổng đơn: {formatVND(m.totalAmount)} ·{" "}
                        {m.participantCount} người
                        {m.payerName && ` · ${m.payerName} đặt`}
                      </p>
                    </div>
                    <p className="shrink-0 font-extrabold text-amber-600">
                      +{formatVND(m.amountDue)}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ))}

      {/* Tab: Thanh toán */}
      {tab === "payments" &&
        (payments.length === 0 ? (
          <EmptyState emoji="💸" title="Chưa có lần thanh toán nào 💸" />
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <Card key={p.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-bold text-stone-800">
                    📅 {formatDate(p.paid_at)}
                  </p>
                  {p.note && (
                    <p className="mt-0.5 truncate text-sm text-stone-400">
                      Ghi chú: {p.note}
                    </p>
                  )}
                </div>
                <p className="shrink-0 font-extrabold text-emerald-600">
                  -{formatVND(Number(p.amount))}
                </p>
              </Card>
            ))}
          </div>
        ))}

      {/* Tab: Dòng thời gian */}
      {tab === "timeline" &&
        (timeline.length === 0 ? (
          <EmptyState
            emoji="🍃"
            title="Chưa có hoạt động nào"
            description="Khi có bữa ăn hoặc thanh toán, dòng thời gian sẽ hiện ở đây."
          />
        ) : (
          <Card className="divide-y divide-stone-100">
            {timeline.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-700">
                    {row.delta > 0 ? "🍜" : "💸"} {formatDate(row.date)} ·{" "}
                    {row.label}
                  </p>
                  <p className="text-xs text-stone-400">
                    Số dư sau đó:{" "}
                    {row.runningBalance > 0
                      ? `còn nợ ${formatVND(row.runningBalance)}`
                      : row.runningBalance === 0
                        ? "sạch nợ 🎉"
                        : `trả dư ${formatVND(Math.abs(row.runningBalance))}`}
                  </p>
                </div>
                <p
                  className={`shrink-0 font-extrabold ${
                    row.delta > 0 ? "text-amber-600" : "text-emerald-600"
                  }`}
                >
                  {row.delta > 0 ? "+" : "-"}
                  {formatVND(Math.abs(row.delta))}
                </p>
              </div>
            ))}
          </Card>
        ))}
    </div>
  );
}

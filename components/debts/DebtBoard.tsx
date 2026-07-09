"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { MemberDebt } from "@/types";
import { buildDebtSummaryText, totalOutstanding } from "@/lib/debt";
import { formatVND } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

type Filter = "all" | "owing" | "clear";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "owing", label: "Còn nợ" },
  { key: "clear", label: "Đã sạch nợ" },
];

export function DebtBoard({
  funHeader,
  debts,
}: {
  funHeader: string;
  debts: MemberDebt[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const outstanding = totalOutstanding(debts);
  const filtered = useMemo(() => {
    if (filter === "owing") return debts.filter((d) => d.balance > 0);
    if (filter === "clear") return debts.filter((d) => d.balance <= 0);
    return debts;
  }, [debts, filter]);

  async function handleCopy() {
    const text = buildDebtSummaryText(funHeader, debts);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Đã copy danh sách công nợ! Gửi vào nhóm chat thôi 📋");
    } catch {
      toast.error("Không copy được — trình duyệt không cho phép");
    }
  }

  return (
    <div className="space-y-4">
      {/* Tổng cần thu */}
      <Card className="flex items-center justify-between bg-gradient-to-br from-rice-400 to-rice-600 p-5 text-white">
        <div>
          <p className="text-sm font-medium opacity-90">Tổng cần thu cả nhóm</p>
          <p className="text-3xl font-extrabold">{formatVND(outstanding)}</p>
        </div>
        <Button variant="translucent" onClick={handleCopy} className="shrink-0">
          📋 Copy gửi nhóm
        </Button>
      </Card>

      {/* Filter */}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              filter === f.key
                ? "bg-rice-500 text-white"
                : "bg-white text-stone-500 ring-1 ring-stone-200 hover:bg-rice-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bảng công nợ */}
      {filtered.length === 0 ? (
        <EmptyState
          emoji={filter === "owing" ? "🎉" : "🍃"}
          title={
            filter === "owing"
              ? "Không ai còn nợ cả!"
              : "Chưa có ai trong danh sách này"
          }
          description={
            filter === "owing" ? "Cả nhóm sạch nợ, quá đỉnh!" : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => {
            const owing = d.balance > 0;
            return (
              <Link
                key={d.member.id}
                href={`/debts/${d.member.id}`}
                className="block"
              >
                <Card
                  className={`cursor-pointer p-4 transition-colors hover:bg-rice-50 ${
                    owing ? "ring-2 ring-amber-200" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-bold text-stone-800">
                        <span className="truncate">{d.member.name}</span>
                        {!d.member.is_active && (
                          <Badge tone="neutral">đã ẩn</Badge>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-400">
                        Đã ăn {formatVND(d.totalDue)} · Đã trả{" "}
                        {formatVND(d.totalPaid)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="text-right">
                        {owing ? (
                          <>
                            <p className="text-lg font-extrabold text-amber-600">
                              {formatVND(d.balance)}
                            </p>
                            <Badge tone="warning">Còn nợ</Badge>
                          </>
                        ) : (
                          <Badge tone="success">Sạch nợ 🎉</Badge>
                        )}
                      </div>
                      <span aria-hidden className="text-lg text-stone-300">
                        ›
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { PaymentWithMember } from "@/types";
import { deletePayment } from "@/app/actions";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatVND, formatDate } from "@/lib/format";

export function PaymentList({ payments }: { payments: PaymentWithMember[] }) {
  const [deleting, setDeleting] = useState<PaymentWithMember | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deletePayment(deleting.id);
      if (result.success) {
        toast.success(result.message);
        setDeleting(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <div className="space-y-2">
        {payments.map((p) => (
          <Card key={p.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-bold text-stone-800">
                💵 {p.member?.name ?? "?"}
              </p>
              <p className="mt-0.5 truncate text-sm text-stone-400">
                {formatDate(p.paid_at)}
                {p.note && ` · ${p.note}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <p className="font-extrabold text-emerald-600">
                +{formatVND(Number(p.amount))}
              </p>
              <button
                onClick={() => setDeleting(p)}
                aria-label="Xóa thanh toán"
                className="rounded-lg px-2 py-1 text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                🗑️
              </button>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Xóa lần thanh toán này?"
        description={
          deleting
            ? `${deleting.member?.name ?? "?"} — ${formatVND(Number(deleting.amount))} ngày ${formatDate(deleting.paid_at)}. Công nợ sẽ được cộng lại.`
            : undefined
        }
        confirmLabel="Xóa luôn"
        danger
        loading={isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { MemberDebt } from "@/types";
import { createPayment } from "@/app/actions";
import { formatVND, todayISO } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

export function PaymentForm({
  groupId,
  debts,
}: {
  groupId: string;
  debts: MemberDebt[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [memberId, setMemberId] = useState(debts[0]?.member.id ?? "");
  const [amountStr, setAmountStr] = useState("");
  const [paidAt, setPaidAt] = useState(todayISO());
  const [note, setNote] = useState("");

  const amount = Number(amountStr) || 0;
  const selectedDebt = useMemo(
    () => debts.find((d) => d.member.id === memberId),
    [debts, memberId]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amount <= 0) {
      toast.error("Số tiền thanh toán phải lớn hơn 0 nhé!");
      return;
    }

    startTransition(async () => {
      const result = await createPayment({
        groupId,
        memberId,
        amount,
        paidAt,
        note,
      });
      if (result.success) {
        toast.success(result.message);
        router.push("/payments");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="space-y-4 p-4">
        <Select
          label="Thành viên"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
        >
          {debts.map((d) => (
            <option key={d.member.id} value={d.member.id}>
              {d.member.name}
              {d.balance > 0 ? ` — đang nợ ${formatVND(d.balance)}` : " — sạch nợ"}
            </option>
          ))}
        </Select>

        {selectedDebt && selectedDebt.balance > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm">
            <span className="font-semibold text-amber-700">
              {selectedDebt.member.name} đang nợ{" "}
              {formatVND(selectedDebt.balance)}
            </span>
            <button
              type="button"
              onClick={() => setAmountStr(String(selectedDebt.balance))}
              className="shrink-0 font-bold text-rice-600 hover:underline"
            >
              Trả hết luôn
            </button>
          </div>
        )}

        <Input
          label="Số tiền thanh toán (đ)"
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          placeholder="Ví dụ: 100000"
          value={amountStr}
          onChange={(e) => setAmountStr(e.target.value)}
        />
        <Input
          label="Ngày thanh toán"
          type="date"
          value={paidAt}
          onChange={(e) => setPaidAt(e.target.value)}
          required
        />
        <Input
          label="Ghi chú (không bắt buộc)"
          placeholder="Ví dụ: chuyển khoản, tiền mặt..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Card>

      {amount > 0 && selectedDebt && (
        <Card className="bg-rice-50 p-4 text-center text-sm">
          <p className="text-stone-500">
            Sau khi lưu, <b>{selectedDebt.member.name}</b> sẽ còn nợ{" "}
            <b className="text-rice-600">
              {formatVND(Math.max(0, selectedDebt.balance - amount))}
            </b>
            {selectedDebt.balance - amount <= 0 && " — sạch nợ! 🎉"}
          </p>
        </Card>
      )}

      <Button type="submit" loading={isPending} className="w-full py-3 text-base">
        💸 Ghi nhận thanh toán
      </Button>
    </form>
  );
}

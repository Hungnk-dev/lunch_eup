"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Member, Food, FoodPick } from "@/types";
import { createMeal } from "@/app/actions";
import { roundPerPerson } from "@/lib/debt";
import { formatVND, todayISO } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

/** Giá trị đặc biệt của select món: tự nhập tay */
const FOOD_CUSTOM = "__custom__";

export function MealForm({
  groupId,
  members,
  foods = [],
  todayPick = null,
}: {
  groupId: string;
  members: Member[];
  foods?: Food[];
  todayPick?: FoodPick | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [date, setDate] = useState(todayISO());
  const [payerId, setPayerId] = useState(members[0]?.id ?? "");
  const [totalStr, setTotalStr] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Món hôm nay (không bắt buộc). Nếu hôm nay đã chốt món trong /foods
  // thì tự gợi ý sẵn món đó.
  const suggestedFoodId =
    todayPick?.food_id && foods.some((f) => f.id === todayPick.food_id)
      ? todayPick.food_id
      : "";
  const [foodChoice, setFoodChoice] = useState<string>(suggestedFoodId);
  const [customFoodName, setCustomFoodName] = useState("");

  const total = Number(totalStr) || 0;
  const perPerson = useMemo(
    () => roundPerPerson(total, selected.size),
    [total, selected.size]
  );

  function toggleMember(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(
      selected.size === members.length
        ? new Set()
        : new Set(members.map((m) => m.id))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validation phía client - server action sẽ validate lại lần nữa
    if (total <= 0) {
      toast.error("Tổng tiền phải lớn hơn 0 nhé!");
      return;
    }
    if (selected.size === 0) {
      toast.error("Chưa tick ai ăn hôm nay cả! 🤔");
      return;
    }

    startTransition(async () => {
      const result = await createMeal({
        groupId,
        date,
        payerMemberId: payerId,
        totalAmount: total,
        participantIds: [...selected],
        foodId:
          foodChoice && foodChoice !== FOOD_CUSTOM ? foodChoice : null,
        foodName: foodChoice === FOOD_CUSTOM ? customFoodName : null,
      });
      if (result.success) {
        toast.success(result.message);
        router.push("/meals");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Ngày"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Select
            label="Người đặt cơm"
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
        <Input
          label="Tổng tiền đã chi (đ)"
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          placeholder="Ví dụ: 250000"
          value={totalStr}
          onChange={(e) => setTotalStr(e.target.value)}
        />

        {/* Món/quán hôm nay - không bắt buộc */}
        <div className="space-y-2">
          <Select
            label="Món / quán hôm nay (không bắt buộc)"
            value={foodChoice}
            onChange={(e) => setFoodChoice(e.target.value)}
          >
            <option value="">— Không ghi món —</option>
            {foods.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
            <option value={FOOD_CUSTOM}>✍️ Khác (tự nhập)...</option>
          </Select>
          {foodChoice === FOOD_CUSTOM && (
            <Input
              placeholder="Nhập tên món / quán"
              value={customFoodName}
              onChange={(e) => setCustomFoodName(e.target.value)}
            />
          )}
          {suggestedFoodId && foodChoice === suggestedFoodId && (
            <p className="text-xs text-stone-400">
              🎲 Gợi ý từ món đã chốt hôm nay trong &ldquo;Hôm nay ăn gì?&rdquo;
            </p>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-bold text-stone-700">
            🙋 Ai ăn hôm nay? ({selected.size}/{members.length})
          </p>
          <button
            type="button"
            onClick={selectAll}
            className="text-sm font-semibold text-rice-600 hover:underline"
          >
            {selected.size === members.length ? "Bỏ chọn hết" : "Chọn tất cả"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {members.map((m) => {
            const checked = selected.has(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMember(m.id)}
                className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  checked
                    ? "border-rice-400 bg-rice-100 text-rice-800"
                    : "border-stone-200 bg-white text-stone-500 hover:border-rice-200"
                }`}
              >
                <span aria-hidden>{checked ? "✅" : "⬜"}</span>
                <span className="truncate">{m.name}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Preview chia tiền */}
      <Card className="bg-rice-50 p-4">
        <p className="mb-2 font-bold text-stone-700">🧮 Chia thử</p>
        {selected.size > 0 && total > 0 ? (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-stone-400">Số người ăn</p>
              <p className="text-lg font-extrabold text-stone-800">
                {selected.size}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-400">Mỗi người trả</p>
              <p className="text-lg font-extrabold text-rice-600">
                {formatVND(perPerson)}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-400">Tổng tiền</p>
              <p className="text-lg font-extrabold text-stone-800">
                {formatVND(total)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-stone-400">
            Nhập tổng tiền và tick người ăn để xem mỗi người trả bao nhiêu.
          </p>
        )}
        {selected.size > 0 && total > 0 && perPerson * selected.size !== total && (
          <p className="mt-2 text-center text-xs text-stone-400">
            Đã làm tròn đến 500đ/người — tổng thu{" "}
            {formatVND(perPerson * selected.size)} (lệch{" "}
            {formatVND(Math.abs(perPerson * selected.size - total))} so với thực
            chi).
          </p>
        )}
      </Card>

      <Button type="submit" loading={isPending} className="w-full py-3 text-base">
        🍚 Lưu bữa ăn
      </Button>
    </form>
  );
}

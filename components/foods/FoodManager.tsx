"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Food } from "@/types";
import { addFood, updateFood, setFoodActive } from "@/app/actions";
import { freshnessLabel } from "@/lib/food-random";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { formatVND } from "@/lib/format";

interface FoodFormValues {
  name: string;
  note: string;
  menuUrl: string;
  estimatedPrice: string;
  tag: string;
}

const EMPTY_FORM: FoodFormValues = {
  name: "",
  note: "",
  menuUrl: "",
  estimatedPrice: "",
  tag: "",
};

/** Form nhập thông tin món - dùng chung cho cả thêm mới và sửa */
function FoodFields({
  values,
  onChange,
}: {
  values: FoodFormValues;
  onChange: (v: FoodFormValues) => void;
}) {
  return (
    <div className="space-y-3">
      <Input
        label="Tên món / quán (bắt buộc)"
        placeholder="Ví dụ: Cơm gà A"
        value={values.name}
        onChange={(e) => onChange({ ...values, name: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Giá tham khảo (đ)"
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          placeholder="45000"
          value={values.estimatedPrice}
          onChange={(e) => onChange({ ...values, estimatedPrice: e.target.value })}
        />
        <Input
          label="Tag"
          placeholder="cơm, bún, healthy..."
          value={values.tag}
          onChange={(e) => onChange({ ...values, tag: e.target.value })}
        />
      </div>
      <Input
        label="Link menu / đặt món"
        placeholder="https://shopeefood.vn/..."
        value={values.menuUrl}
        onChange={(e) => onChange({ ...values, menuUrl: e.target.value })}
      />
      <Input
        label="Ghi chú"
        placeholder="Ví dụ: Có suất 45k, đặt trước 10h30"
        value={values.note}
        onChange={(e) => onChange({ ...values, note: e.target.value })}
      />
    </div>
  );
}

export function FoodManager({
  groupId,
  foods,
}: {
  groupId: string;
  foods: Food[];
}) {
  const [isPending, startTransition] = useTransition();

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<FoodFormValues>(EMPTY_FORM);

  const [editing, setEditing] = useState<Food | null>(null);
  const [editForm, setEditForm] = useState<FoodFormValues>(EMPTY_FORM);

  const [hiding, setHiding] = useState<Food | null>(null);

  const active = foods.filter((f) => f.is_active);
  const hidden = foods.filter((f) => !f.is_active);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name.trim()) {
      toast.error("Nhập tên món đã nhé!");
      return;
    }
    startTransition(async () => {
      const result = await addFood({ groupId, ...addForm });
      if (result.success) {
        toast.success(result.message);
        setAddForm(EMPTY_FORM);
        setShowAdd(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function startEdit(food: Food) {
    setEditing(food);
    setEditForm({
      name: food.name,
      note: food.note ?? "",
      menuUrl: food.menu_url ?? "",
      estimatedPrice:
        food.estimated_price != null ? String(food.estimated_price) : "",
      tag: food.tag ?? "",
    });
  }

  function handleSaveEdit() {
    if (!editing) return;
    if (!editForm.name.trim()) {
      toast.error("Tên món không được để trống");
      return;
    }
    startTransition(async () => {
      const result = await updateFood({ foodId: editing.id, ...editForm });
      if (result.success) {
        toast.success(result.message);
        setEditing(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleHide() {
    if (!hiding) return;
    startTransition(async () => {
      const result = await setFoodActive(hiding.id, false);
      if (result.success) {
        toast.success(result.message);
        setHiding(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRestore(food: Food) {
    startTransition(async () => {
      const result = await setFoodActive(food.id, true);
      if (result.success) toast.success(`"${food.name}" đã trở lại thực đơn! 🍜`);
      else toast.error(result.error);
    });
  }

  function FoodInfo({ food }: { food: Food }) {
    const fresh = freshnessLabel(food);
    return (
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-bold text-stone-800">
          <span className="truncate">{food.name}</span>
          {food.tag && <Badge tone="neutral">#{food.tag}</Badge>}
          {food.is_active && <Badge tone={fresh.tone}>{fresh.label}</Badge>}
        </p>
        <p className="mt-0.5 truncate text-sm text-stone-400">
          {[
            food.estimated_price != null && food.estimated_price > 0
              ? `~${formatVND(Number(food.estimated_price))}`
              : null,
            `đã chọn ${food.picked_count} lần`,
            food.note,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {food.menu_url && (
          <a
            href={food.menu_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-rice-600 hover:underline"
          >
            🔗 Menu
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Thêm món */}
      {showAdd ? (
        <Card className="p-4">
          <p className="mb-3 font-bold text-stone-700">➕ Thêm món mới</p>
          <form onSubmit={handleAdd} className="space-y-3">
            <FoodFields values={addForm} onChange={setAddForm} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setShowAdd(false)}>
                Hủy
              </Button>
              <Button type="submit" loading={isPending}>
                Thêm vào thực đơn
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button variant="secondary" onClick={() => setShowAdd(true)} className="w-full">
          ➕ Thêm món / quán mới
        </Button>
      )}

      {/* Danh sách active */}
      {active.length === 0 ? (
        <EmptyState
          emoji="🍜"
          title="Thực đơn đang trống trơn"
          description="Thêm vài món tủ của team để bắt đầu quay nồi cơm nhé!"
        />
      ) : (
        <div className="space-y-2">
          {active.map((food) =>
            editing?.id === food.id ? (
              <Card key={food.id} className="space-y-3 p-4">
                <FoodFields values={editForm} onChange={setEditForm} />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setEditing(null)}>
                    Hủy
                  </Button>
                  <Button onClick={handleSaveEdit} loading={isPending}>
                    Lưu
                  </Button>
                </div>
              </Card>
            ) : (
              <Card key={food.id} className="flex items-center justify-between gap-3 p-4">
                <FoodInfo food={food} />
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" onClick={() => startEdit(food)}>
                    ✏️
                  </Button>
                  <Button variant="ghost" onClick={() => setHiding(food)}>
                    🙈
                  </Button>
                </div>
              </Card>
            )
          )}
        </div>
      )}

      {/* Món bị ẩn */}
      {hidden.length > 0 && (
        <div>
          <p className="mb-3 font-bold text-stone-500">
            🙈 Món bị ẩn ({hidden.length})
          </p>
          <div className="space-y-2">
            {hidden.map((food) => (
              <Card
                key={food.id}
                className="flex items-center justify-between gap-3 p-4 opacity-70"
              >
                <FoodInfo food={food} />
                <Button
                  variant="secondary"
                  onClick={() => handleRestore(food)}
                  loading={isPending}
                  className="shrink-0"
                >
                  ♻️ Khôi phục
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!hiding}
        title={`Ẩn "${hiding?.name}" khỏi thực đơn?`}
        description="Món sẽ không xuất hiện khi random nữa, nhưng lịch sử vẫn được giữ. Có thể khôi phục bất cứ lúc nào."
        confirmLabel="Ẩn luôn"
        danger
        loading={isPending}
        onConfirm={handleHide}
        onCancel={() => setHiding(null)}
      />
    </div>
  );
}

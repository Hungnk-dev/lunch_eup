import type { Food } from "@/types";

/**
 * LOGIC RANDOM MÓN "HÔM NAY ĂN GÌ?"
 *
 * Random có trọng số để tránh trùng món liên tục:
 * - Món CHƯA TỪNG được chọn: weight cao nhất (3.0) - ưu tiên thử món mới.
 * - Món đã chọn: weight tăng dần theo số ngày chưa ăn,
 *   từ 0.2 (vừa ăn hôm nay) đến 2.0 (>= 14 ngày chưa ăn).
 * - Vẫn là random nên món mới ăn vẫn CÓ THỂ trúng, chỉ là ít khả năng hơn.
 */

const NEVER_PICKED_WEIGHT = 3.0;
const MIN_WEIGHT = 0.2;
const MAX_PICKED_WEIGHT = 2.0;
const FULL_WEIGHT_AFTER_DAYS = 14;

export function calculateFoodWeight(food: Food, now: Date = new Date()): number {
  if (!food.last_picked_at) return NEVER_PICKED_WEIGHT;

  const msSincePicked = now.getTime() - new Date(food.last_picked_at).getTime();
  const daysSincePicked = Math.max(0, msSincePicked / (1000 * 60 * 60 * 24));
  const ratio = Math.min(daysSincePicked / FULL_WEIGHT_AFTER_DAYS, 1);

  return MIN_WEIGHT + ratio * (MAX_PICKED_WEIGHT - MIN_WEIGHT);
}

/**
 * Chọn ngẫu nhiên 1 món trong danh sách active theo trọng số.
 * `excludeId`: loại món đang hiển thị khi bấm "Random lại"
 * (chỉ áp dụng nếu còn món khác để chọn).
 */
export function getRandomFood(
  foods: Food[],
  excludeId?: string | null
): Food | null {
  let pool = foods.filter((f) => f.is_active);
  if (pool.length === 0) return null;

  if (excludeId && pool.length > 1) {
    pool = pool.filter((f) => f.id !== excludeId);
  }

  const now = new Date();
  const weights = pool.map((f) => calculateFoodWeight(f, now));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  let r = Math.random() * totalWeight;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/** Nhãn hiển thị "độ tươi" của món dựa trên lần chọn gần nhất */
export function freshnessLabel(food: Food): {
  label: string;
  tone: "success" | "warning" | "neutral";
} {
  if (!food.last_picked_at) return { label: "Chưa thử lần nào ✨", tone: "success" };

  const days = Math.floor(
    (Date.now() - new Date(food.last_picked_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 2) return { label: "Mới ăn gần đây", tone: "warning" };
  if (days >= 7) return { label: "Lâu rồi chưa ăn", tone: "success" };
  return { label: `${days} ngày trước`, tone: "neutral" };
}

/** Text copy gửi nhóm chat sau khi chốt món */
export function buildFoodPickText(food: Food): string {
  const lines: string[] = ["HÔM NAY ĂN GÌ?", "", `Chốt kèo: ${food.name} 🍚`];
  if (food.note) lines.push(`Ghi chú: ${food.note}`);
  if (food.estimated_price != null && food.estimated_price > 0)
    lines.push(
      `Giá tham khảo: ${Math.round(Number(food.estimated_price)).toLocaleString("vi-VN")}đ`
    );
  if (food.menu_url) lines.push(`Link menu: ${food.menu_url}`);
  lines.push("", "Ai ăn thì báo nhé!");
  return lines.join("\n");
}

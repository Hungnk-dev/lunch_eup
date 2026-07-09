"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { Food } from "@/types";
import { confirmFoodPick } from "@/app/actions";
import { getRandomFood, freshnessLabel, buildFoodPickText } from "@/lib/food-random";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatVND } from "@/lib/format";

/**
 * Section "Hôm nay ăn gì?" - random món có hiệu ứng quay nồi cơm.
 * Random chạy client-side (chỉ trong danh sách active, weighted theo
 * lib/food-random.ts); bấm "Chốt món này" mới ghi vào database.
 */
export function FoodPicker({ foods }: { foods: Food[] }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Food | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function spin() {
    if (foods.length === 0) return;
    setSpinning(true);
    setConfirmed(false);
    // Hiệu ứng "Đang quay nồi cơm..." ~0.8s cho vui rồi mới hiện kết quả
    timerRef.current = setTimeout(() => {
      setResult(getRandomFood(foods, result?.id));
      setSpinning(false);
    }, 800);
  }

  function handleConfirm() {
    if (!result) {
      toast.error("Chưa random món nào mà chốt gì? 😅");
      return;
    }
    startTransition(async () => {
      const res = await confirmFoodPick(result.id);
      if (res.success) {
        toast.success(res.message);
        setConfirmed(true);
      } else {
        toast.error(res.error);
      }
    });
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(buildFoodPickText(result));
      toast.success("Đã copy! Gửi vào nhóm chat thôi 📋");
    } catch {
      toast.error("Không copy được — trình duyệt không cho phép");
    }
  }

  // Empty state khi chưa có món active nào
  if (foods.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 bg-gradient-to-br from-rice-400 to-rice-600 p-8 text-center text-white">
        <span className="text-5xl" aria-hidden>🍜</span>
        <p className="text-lg font-bold">
          Chưa có món nào trong thực đơn, thêm vài món trước nha 🍜
        </p>
        <p className="text-sm opacity-90">
          Kéo xuống phần &ldquo;Thực đơn team&rdquo; bên dưới để thêm món đầu tiên.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-rice-400 to-rice-600 p-6 text-white">
      {spinning ? (
        /* Loading state khi đang quay */
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="animate-spin text-6xl" aria-hidden>🍚</span>
          <p className="text-lg font-bold">Đang quay nồi cơm...</p>
          <p className="text-sm opacity-80">Định mệnh bữa trưa sắp được quyết định 🔮</p>
        </div>
      ) : result ? (
        /* Card kết quả */
        <div className="text-center">
          <p className="text-sm font-medium opacity-90">
            {confirmed ? "✅ Đã chốt kèo hôm nay:" : "Nồi cơm phán rằng:"}
          </p>
          <p className="mt-2 text-3xl font-extrabold leading-tight">
            🍽️ {result.name}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
            {result.tag && (
              <span className="rounded-full bg-white/20 px-3 py-1 font-semibold">
                #{result.tag}
              </span>
            )}
            {result.estimated_price != null && result.estimated_price > 0 && (
              <span className="rounded-full bg-white/20 px-3 py-1 font-semibold">
                ~{formatVND(Number(result.estimated_price))}
              </span>
            )}
            <span className="rounded-full bg-white/20 px-3 py-1 font-semibold">
              {freshnessLabel(result).label}
            </span>
          </div>
          {result.note && <p className="mt-3 text-sm opacity-90">📝 {result.note}</p>}
          {result.menu_url && (
            <a
              href={result.menu_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-semibold underline opacity-90 hover:opacity-100"
            >
              🔗 Xem menu / đặt món
            </a>
          )}

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {confirmed ? (
              <>
                <Button variant="inverse" onClick={handleCopy}>
                  📋 Copy gửi nhóm
                </Button>
                <Button variant="translucent" onClick={spin}>
                  🎲 Quay món khác
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="inverse"
                  onClick={handleConfirm}
                  loading={isPending}
                >
                  ✅ Chốt món này
                </Button>
                <Button variant="translucent" onClick={spin}>
                  🎲 Random lại
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Trạng thái ban đầu */
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="text-6xl" aria-hidden>🍲</span>
          <div>
            <p className="text-xl font-extrabold">Trưa nay ăn gì đây ta?</p>
            <p className="mt-1 text-sm opacity-90">
              {foods.length} món trong thực đơn đang chờ được gọi tên
            </p>
          </div>
          <Button variant="inverse" onClick={spin} className="px-6 py-3 text-base">
            🎲 Quay nồi cơm
          </Button>
        </div>
      )}
    </Card>
  );
}

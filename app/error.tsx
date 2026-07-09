"use client";

import { Button } from "@/components/ui/Button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="text-6xl" aria-hidden>
        🍳
      </span>
      <div>
        <p className="text-xl font-extrabold text-stone-800">
          Ối, có gì đó cháy khét rồi!
        </p>
        <p className="mt-1 text-sm text-stone-500">
          App gặp lỗi bất ngờ. Thử tải lại xem sao nhé.
        </p>
      </div>
      <Button onClick={reset}>🔄 Thử lại</Button>
    </div>
  );
}

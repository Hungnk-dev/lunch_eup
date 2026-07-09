"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Group } from "@/types";
import { updateGroup } from "@/app/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/** Gợi ý header vui để admin chọn nhanh */
const HEADER_SUGGESTIONS = [
  "Biệt đội cơm trưa 🍚",
  "Hội đói bụng 🤤",
  "Cơm ngon không quạu 😤",
  "Ăn trước tính sau 💸",
  "Đội quân thìa đũa 🥢",
  "Hội bạn thân cơm hộp 🍱",
];

export function SettingsForm({ group }: { group: Group }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(group.name);
  const [funHeader, setFunHeader] = useState(group.fun_header ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Tên nhóm không được để trống");
      return;
    }
    startTransition(async () => {
      const result = await updateGroup(group.id, name, funHeader);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="space-y-4 p-4">
        <Input
          label="Tên nhóm (chính thức)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Team Marketing"
        />
        <Input
          label="Header vui (hiển thị lớn ở trang chủ)"
          value={funHeader}
          onChange={(e) => setFunHeader(e.target.value)}
          placeholder="Ví dụ: Biệt đội cơm trưa 🍚"
        />
        <div>
          <p className="mb-2 text-sm font-semibold text-stone-700">
            Gợi ý cho nhóm vui vẻ:
          </p>
          <div className="flex flex-wrap gap-2">
            {HEADER_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFunHeader(s)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  funHeader === s
                    ? "bg-rice-500 text-white"
                    : "bg-rice-100 text-rice-700 hover:bg-rice-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Preview */}
      <Card className="bg-gradient-to-br from-rice-400 to-rice-600 p-5 text-white">
        <p className="text-xs font-medium opacity-80">Xem trước header:</p>
        <p className="mt-1 text-2xl font-extrabold">
          {funHeader.trim() || name.trim() || "Cơm Chung"}
        </p>
      </Card>

      <Button type="submit" loading={isPending} className="w-full py-3 text-base">
        💾 Lưu cài đặt
      </Button>
    </form>
  );
}

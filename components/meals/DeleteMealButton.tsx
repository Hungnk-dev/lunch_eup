"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteMeal } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function DeleteMealButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteMeal(sessionId);
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
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        🗑️ Xóa bữa này
      </Button>
      <ConfirmDialog
        open={open}
        title="Xóa bữa ăn này?"
        description="Công nợ của những người ăn bữa này sẽ được trừ lại. Hành động này không hoàn tác được."
        confirmLabel="Xóa luôn"
        danger
        loading={isPending}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

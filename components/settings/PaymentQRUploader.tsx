"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { removePaymentQR, updatePaymentQR } from "@/app/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/** Upload / đổi / xoá ảnh QR chuyển khoản của nhóm - lưu ngay, không cần bấm "Lưu cài đặt" */
export function PaymentQRUploader({
  groupId,
  qrUrl,
}: {
  groupId: string;
  qrUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, startUpload] = useTransition();
  const [isRemoving, startRemove] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh tối đa 5MB thôi nhé");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    startUpload(async () => {
      const result = await updatePaymentQR(groupId, formData);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRemove() {
    startRemove(async () => {
      const result = await removePaymentQR(groupId);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card className="space-y-3 p-4">
      <div>
        <p className="text-sm font-semibold text-stone-700">📱 Mã QR chuyển khoản</p>
        <p className="text-xs text-stone-500">
          Hiện ở bảng công nợ để mọi người quét trả tiền. PNG, JPG hoặc WEBP, tối đa 5MB.
        </p>
      </div>

      {qrUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrUrl}
          alt="Mã QR chuyển khoản"
          className="mx-auto h-48 w-48 rounded-xl object-contain ring-1 ring-black/5"
        />
      ) : (
        <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 text-sm text-stone-400">
          Chưa có mã QR
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          loading={isUploading}
          disabled={isRemoving}
          onClick={() => inputRef.current?.click()}
          className="flex-1"
        >
          {qrUrl ? "🔄 Đổi ảnh QR" : "⬆️ Tải ảnh QR lên"}
        </Button>
        {qrUrl && (
          <Button
            type="button"
            variant="secondary"
            loading={isRemoving}
            disabled={isUploading}
            onClick={handleRemove}
          >
            🗑️ Xoá
          </Button>
        )}
      </div>
    </Card>
  );
}

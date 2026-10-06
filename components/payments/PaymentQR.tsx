import { Card } from "@/components/ui/Card";

/** Khối QR chuyển khoản để mọi người quét trả tiền cơm (ảnh đổi ở Cài đặt) */
export function PaymentQR({ src, amount }: { src: string | null; amount?: string }) {
  if (!src) return null;
  return (
    <Card className="flex flex-col items-center gap-3 p-4 text-center">
      <p className="text-sm font-bold text-stone-700">📱 Quét mã để chuyển khoản</p>
      <a href={src} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Mã QR chuyển khoản"
          className="h-56 w-56 rounded-xl object-contain ring-1 ring-black/5"
        />
      </a>
      <p className="text-xs text-stone-500">
        {amount ? (
          <>
            Số tiền cần chuyển: <b className="text-rice-600">{amount}</b> ·{" "}
          </>
        ) : null}
        Nhớ ghi tên trong nội dung chuyển khoản nhé!
      </p>
    </Card>
  );
}

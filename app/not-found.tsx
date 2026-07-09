import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="text-6xl" aria-hidden>
        🍽️
      </span>
      <div>
        <p className="text-xl font-extrabold text-stone-800">
          Trang này không có trong thực đơn!
        </p>
        <p className="mt-1 text-sm text-stone-500">
          Đường dẫn không tồn tại hoặc đã bị xóa.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-xl bg-rice-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rice-600"
      >
        🏠 Về trang chủ
      </Link>
    </div>
  );
}

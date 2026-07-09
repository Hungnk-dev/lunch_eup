export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
      <span className="animate-bounce text-5xl" aria-hidden>
        🍚
      </span>
      <p className="text-sm font-semibold text-stone-400">
        Đang dọn mâm, chờ xíu nha...
      </p>
    </div>
  );
}

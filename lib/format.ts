/** Helper format tiền & ngày kiểu Việt Nam */

/** 150000 => "150.000đ" */
export function formatVND(amount: number): string {
  return `${Math.round(amount).toLocaleString("vi-VN")}đ`;
}

/** "2026-07-09" => "09/07/2026" */
export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

/** Ngày hôm nay dạng YYYY-MM-DD (theo giờ máy local) */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

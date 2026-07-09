import { type ReactNode } from "react";

/** Card bo góc + shadow nhẹ - khối hiển thị cơ bản của app */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white shadow-sm ring-1 ring-black/5 ${className}`}
    >
      {children}
    </div>
  );
}

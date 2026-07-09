import { type ReactNode } from "react";

/** Empty state dễ thương khi chưa có dữ liệu */
export function EmptyState({
  emoji,
  title,
  description,
  action,
}: {
  emoji: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-rice-200 bg-rice-50/50 px-6 py-12 text-center">
      <span className="text-5xl" aria-hidden>
        {emoji}
      </span>
      <p className="text-lg font-bold text-stone-700">{title}</p>
      {description && <p className="max-w-xs text-sm text-stone-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

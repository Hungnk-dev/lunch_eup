import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { getGroup, getMeals } from "@/lib/data";
import { formatVND, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MealsPage() {
  const group = await getGroup();
  if (!group) {
    return (
      <AppShell>
        <EmptyState emoji="🏗️" title="Chưa có nhóm" description="Chạy SQL migration trước nhé (xem README)." />
      </AppShell>
    );
  }

  const supabase = await createClient();
  const [meals, { data: { user } }] = await Promise.all([
    getMeals(group.id),
    supabase.auth.getUser(),
  ]);

  return (
    <AppShell>
      <PageHeader
        emoji="🍜"
        title="Lịch sử bữa ăn"
        description={`${meals.length} bữa đã được ghi lại`}
        action={
          user ? (
            <Link href="/meals/new">
              <Button>➕ Tạo bữa ăn</Button>
            </Link>
          ) : undefined
        }
      />

      {meals.length === 0 ? (
        <EmptyState
          emoji="🍽️"
          title="Chưa có bữa ăn nào"
          description="Bụng đói mà sổ sách cũng đói. Tạo bữa ăn đầu tiên thôi!"
          action={
            user ? (
              <Link href="/meals/new">
                <Button>🍜 Tạo bữa ăn đầu tiên</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {meals.map((meal) => (
            <Link key={meal.id} href={`/meals/${meal.id}`} className="block">
              <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-rice-50">
                <div className="min-w-0">
                  <p className="font-bold text-stone-800">
                    📅 {formatDate(meal.date)}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-stone-500">
                    {meal.payer?.name ?? "?"} đặt · {meal.participant_count}{" "}
                    người ăn
                    {meal.food_name_snapshot && ` · 🍽️ ${meal.food_name_snapshot}`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-extrabold text-rice-600">
                    {formatVND(Number(meal.total_amount))}
                  </p>
                  <p className="text-xs text-stone-400">
                    {formatVND(Number(meal.per_person_amount))}/người
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { DeleteMealButton } from "@/components/meals/DeleteMealButton";
import { getMeal } from "@/lib/data";
import { formatVND, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [meal, { data: { user } }] = await Promise.all([
    getMeal(id),
    supabase.auth.getUser(),
  ]);

  if (!meal) notFound();

  return (
    <AppShell>
      <PageHeader
        emoji="🍱"
        title={`Bữa ăn ${formatDate(meal.date)}`}
        action={user ? <DeleteMealButton sessionId={meal.id} /> : undefined}
      />

      <Card className="p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-stone-400">Người đặt</p>
            <p className="font-bold text-stone-800">🧑‍🍳 {meal.payer?.name ?? "?"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-400">Tổng tiền</p>
            <p className="font-bold text-rice-600">
              {formatVND(Number(meal.total_amount))}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-400">Số người ăn</p>
            <p className="font-bold text-stone-800">{meal.participant_count} người</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-400">Mỗi người trả</p>
            <p className="font-bold text-rice-600">
              {formatVND(Number(meal.per_person_amount))}
            </p>
          </div>
          {meal.food_name_snapshot && (
            <div className="col-span-2">
              <p className="text-xs font-semibold text-stone-400">Món hôm đó</p>
              <p className="font-bold text-stone-800">
                🍽️ {meal.food_name_snapshot}
              </p>
            </div>
          )}
        </div>
      </Card>

      <h2 className="mb-3 mt-6 text-sm font-bold uppercase tracking-wide text-stone-400">
        Người ăn hôm đó
      </h2>
      <Card className="divide-y divide-stone-100">
        {meal.meal_participants.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3">
            <p className="font-semibold text-stone-700">🍚 {p.member?.name ?? "?"}</p>
            <p className="text-sm font-bold text-stone-500">
              {formatVND(Number(p.amount_due))}
            </p>
          </div>
        ))}
      </Card>

      <div className="mt-6">
        <Link href="/meals" className="text-sm font-semibold text-rice-600 hover:underline">
          ← Quay lại lịch sử bữa ăn
        </Link>
      </div>
    </AppShell>
  );
}

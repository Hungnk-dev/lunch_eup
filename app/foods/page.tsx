import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { FoodPicker } from "@/components/foods/FoodPicker";
import { FoodManager } from "@/components/foods/FoodManager";
import { getGroup, getFoods, getRecentFoodPicks } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FoodsPage() {
  const group = await getGroup();
  if (!group) {
    return (
      <AppShell>
        <EmptyState emoji="🏗️" title="Chưa có nhóm" description="Chạy SQL migration trước nhé (xem README)." />
      </AppShell>
    );
  }

  const [foods, recentPicks] = await Promise.all([
    getFoods(group.id),
    getRecentFoodPicks(group.id),
  ]);
  const activeFoods = foods.filter((f) => f.is_active);

  return (
    <AppShell>
      <PageHeader
        emoji="🎲"
        title="Hôm nay ăn gì?"
        description="Hết cãi nhau chuyện trưa nay ăn gì — để nồi cơm quyết định!"
      />

      {/* Section random nổi bật */}
      <FoodPicker foods={activeFoods} />

      {/* Lịch sử chốt món */}
      {recentPicks.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-400">
            🕐 Đã chốt gần đây
          </h2>
          <Card className="divide-y divide-stone-100">
            {recentPicks.map((pick) => (
              <div
                key={pick.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-stone-700">
                    🍚 {pick.food_name_snapshot}
                  </p>
                  {pick.note && (
                    <p className="truncate text-xs text-stone-400">{pick.note}</p>
                  )}
                </div>
                <p className="shrink-0 text-sm text-stone-400">
                  {formatDate(pick.picked_at)}
                </p>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Quản lý thực đơn */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-400">
          📖 Thực đơn team
        </h2>
        <FoodManager groupId={group.id} foods={foods} />
      </div>
    </AppShell>
  );
}

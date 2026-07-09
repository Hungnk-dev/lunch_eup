import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { MealForm } from "@/components/meals/MealForm";
import { getGroup, getMembers, getFoods, getTodayFoodPick } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NewMealPage() {
  const group = await getGroup();
  if (!group) {
    return (
      <AppShell>
        <EmptyState emoji="🏗️" title="Chưa có nhóm" description="Chạy SQL migration trước nhé (xem README)." />
      </AppShell>
    );
  }

  const [members, foods, todayPick] = await Promise.all([
    getMembers(group.id),
    getFoods(group.id),
    getTodayFoodPick(group.id),
  ]);
  const activeMembers = members.filter((m) => m.is_active);
  const activeFoods = foods.filter((f) => f.is_active);

  return (
    <AppShell>
      <PageHeader
        emoji="🍜"
        title="Tạo bữa ăn"
        description="Nhập tổng tiền, tick người ăn — app tự chia đều."
      />
      {activeMembers.length === 0 ? (
        <EmptyState
          emoji="🧑‍🍳"
          title="Chưa có thành viên nào"
          description="Thêm thành viên trước rồi mới ghi bữa ăn được nhé!"
        />
      ) : (
        <MealForm
          groupId={group.id}
          members={activeMembers}
          foods={activeFoods}
          todayPick={todayPick}
        />
      )}
    </AppShell>
  );
}

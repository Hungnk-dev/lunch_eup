import { createClient } from "@/lib/supabase/server";
import type {
  Group,
  Member,
  MealSessionWithDetails,
  MemberMealRow,
  Payment,
  PaymentWithMember,
  Food,
  FoodPick,
} from "@/types";

/**
 * MVP: app hoạt động với 1 nhóm duy nhất (nhóm được seed sẵn trong migration).
 * Mọi hàm đọc dữ liệu đều gom về đây để page/component gọi cho gọn.
 */

export async function getGroup(): Promise<Group | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getMembers(groupId: string): Promise<Member[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("group_id", groupId)
    .order("name", { ascending: true });
  return data ?? [];
}

export async function getMeals(
  groupId: string
): Promise<MealSessionWithDetails[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meal_sessions")
    .select(
      `*,
       payer:members!meal_sessions_payer_member_id_fkey(id, name),
       meal_participants(*, member:members(id, name))`
    )
    .eq("group_id", groupId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  return (data as MealSessionWithDetails[] | null) ?? [];
}

export async function getMeal(
  id: string
): Promise<MealSessionWithDetails | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meal_sessions")
    .select(
      `*,
       payer:members!meal_sessions_payer_member_id_fkey(id, name),
       meal_participants(*, member:members(id, name))`
    )
    .eq("id", id)
    .maybeSingle();
  return data as MealSessionWithDetails | null;
}

export async function getPayments(
  groupId: string
): Promise<PaymentWithMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select(`*, member:members(id, name)`)
    .eq("group_id", groupId)
    .order("paid_at", { ascending: false })
    .order("created_at", { ascending: false });
  return (data as PaymentWithMember[] | null) ?? [];
}

export async function getFoods(groupId: string): Promise<Food[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("foods")
    .select("*")
    .eq("group_id", groupId)
    .order("name", { ascending: true });
  return data ?? [];
}

/** 10 lần chốt món gần nhất */
export async function getRecentFoodPicks(groupId: string): Promise<FoodPick[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("food_picks")
    .select("*")
    .eq("group_id", groupId)
    .order("picked_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

/** Món đã chốt gần nhất TRONG NGÀY hôm nay (để gợi ý khi tạo bữa ăn) */
export async function getTodayFoodPick(groupId: string): Promise<FoodPick | null> {
  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("food_picks")
    .select("*")
    .eq("group_id", groupId)
    .gte("picked_at", startOfDay.toISOString())
    .order("picked_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/**
 * Chi tiết công nợ của một thành viên: thông tin người + từng bữa đã ăn
 * (kèm món, người đặt) + từng lần thanh toán. Dùng cho trang /debts/[memberId].
 */
export async function getMemberDebtDetail(memberId: string): Promise<{
  member: Member;
  meals: MemberMealRow[];
  payments: Payment[];
} | null> {
  const supabase = await createClient();

  const [memberRes, participantsRes, paymentsRes] = await Promise.all([
    supabase.from("members").select("*").eq("id", memberId).maybeSingle(),
    supabase
      .from("meal_participants")
      .select(
        `amount_due,
         session:meal_sessions!inner(
           id, date, total_amount, participant_count, food_name_snapshot,
           payer:members!meal_sessions_payer_member_id_fkey(name)
         )`
      )
      .eq("member_id", memberId),
    supabase
      .from("payments")
      .select("*")
      .eq("member_id", memberId)
      .order("paid_at", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (!memberRes.data) return null;

  type ParticipantRow = {
    amount_due: number;
    session: {
      id: string;
      date: string;
      total_amount: number;
      participant_count: number;
      food_name_snapshot: string | null;
      payer: { name: string } | null;
    };
  };

  const meals: MemberMealRow[] = (
    (participantsRes.data as unknown as ParticipantRow[] | null) ?? []
  )
    .map((row) => ({
      sessionId: row.session.id,
      date: row.session.date,
      foodName: row.session.food_name_snapshot,
      totalAmount: Number(row.session.total_amount),
      participantCount: row.session.participant_count,
      amountDue: Number(row.amount_due),
      payerName: row.session.payer?.name ?? null,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    member: memberRes.data,
    meals,
    payments: paymentsRes.data ?? [],
  };
}

/** Dữ liệu thô để tính công nợ (xem lib/debt.ts) */
export async function getDebtRawData(groupId: string) {
  const supabase = await createClient();

  const [membersRes, participantsRes, paymentsRes] = await Promise.all([
    supabase.from("members").select("*").eq("group_id", groupId),
    supabase
      .from("meal_participants")
      .select("member_id, amount_due, session:meal_sessions!inner(group_id)")
      .eq("session.group_id", groupId),
    supabase.from("payments").select("member_id, amount").eq("group_id", groupId),
  ]);

  return {
    members: (membersRes.data as Member[] | null) ?? [],
    participants:
      (participantsRes.data as { member_id: string; amount_due: number }[] | null) ??
      [],
    payments:
      (paymentsRes.data as { member_id: string; amount: number }[] | null) ?? [],
  };
}

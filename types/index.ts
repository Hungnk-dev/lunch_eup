/** Các type khớp với schema database Supabase */

export interface Group {
  id: string;
  name: string;
  fun_header: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Member {
  id: string;
  group_id: string;
  name: string;
  note: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface MealSession {
  id: string;
  group_id: string;
  date: string;
  payer_member_id: string | null;
  total_amount: number;
  participant_count: number;
  per_person_amount: number;
  food_id: string | null;
  food_name_snapshot: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Food {
  id: string;
  group_id: string;
  name: string;
  note: string | null;
  menu_url: string | null;
  estimated_price: number | null;
  tag: string | null;
  is_active: boolean;
  picked_count: number;
  last_picked_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface FoodPick {
  id: string;
  group_id: string;
  food_id: string | null;
  food_name_snapshot: string;
  picked_at: string;
  picked_by: string | null;
  note: string | null;
}

export interface MealParticipant {
  id: string;
  session_id: string;
  member_id: string;
  amount_due: number;
  created_at: string;
}

export interface Payment {
  id: string;
  group_id: string;
  member_id: string;
  amount: number;
  paid_at: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

/** Bữa ăn kèm thông tin người đặt + người ăn (dùng cho trang lịch sử) */
export interface MealSessionWithDetails extends MealSession {
  payer: Pick<Member, "id" | "name"> | null;
  meal_participants: (MealParticipant & {
    member: Pick<Member, "id" | "name"> | null;
  })[];
}

/** Thanh toán kèm tên thành viên */
export interface PaymentWithMember extends Payment {
  member: Pick<Member, "id" | "name"> | null;
}

/** Một bữa ăn trong chi tiết công nợ của thành viên */
export interface MemberMealRow {
  sessionId: string;
  date: string;
  foodName: string | null;
  totalAmount: number;
  participantCount: number;
  amountDue: number;
  payerName: string | null;
}

/** Công nợ tổng hợp của một thành viên */
export interface MemberDebt {
  member: Member;
  totalDue: number; // tổng tiền các bữa đã ăn
  totalPaid: number; // tổng đã thanh toán
  balance: number; // còn nợ = totalDue - totalPaid
}

/** Kết quả trả về chuẩn của các server action */
export type ActionResult =
  | { success: true; message?: string }
  | { success: false; error: string };

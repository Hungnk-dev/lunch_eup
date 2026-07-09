"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { roundPerPerson } from "@/lib/debt";
import type { ActionResult } from "@/types";

/**
 * Toàn bộ server actions (mutations) của app.
 * Mỗi action tự check đăng nhập; RLS ở database là lớp bảo vệ thứ hai.
 */

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập để thực hiện thao tác này");
  return { supabase, user };
}

// ---------- NHÓM ----------

export async function updateGroup(
  groupId: string,
  name: string,
  funHeader: string
): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    if (!name.trim()) return { success: false, error: "Tên nhóm không được để trống" };

    const { error } = await supabase
      .from("groups")
      .update({
        name: name.trim(),
        fun_header: funHeader.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", groupId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/", "layout");
    return { success: true, message: "Đã lưu cài đặt nhóm" };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ---------- THÀNH VIÊN ----------

export async function addMember(
  groupId: string,
  name: string,
  note: string
): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    if (!name.trim()) return { success: false, error: "Tên thành viên không được để trống" };

    const { error } = await supabase.from("members").insert({
      group_id: groupId,
      name: name.trim(),
      note: note.trim() || null,
    });

    if (error) return { success: false, error: error.message };
    revalidatePath("/members");
    return { success: true, message: `Đã thêm ${name.trim()} vào nhóm` };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateMember(
  memberId: string,
  name: string,
  note: string
): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    if (!name.trim()) return { success: false, error: "Tên thành viên không được để trống" };

    const { error } = await supabase
      .from("members")
      .update({
        name: name.trim(),
        note: note.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", memberId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/members");
    return { success: true, message: "Đã cập nhật thành viên" };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Không xóa cứng - chỉ ẩn (is_active = false), giữ nguyên lịch sử công nợ */
export async function setMemberActive(
  memberId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("members")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", memberId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/members");
    return {
      success: true,
      message: isActive ? "Đã khôi phục thành viên" : "Đã ẩn thành viên",
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ---------- BỮA ĂN ----------

export async function createMeal(input: {
  groupId: string;
  date: string;
  payerMemberId: string;
  totalAmount: number;
  participantIds: string[];
  /** Món chọn từ thực đơn (nếu có) */
  foodId?: string | null;
  /** Tên món tự nhập (khi không chọn từ thực đơn) */
  foodName?: string | null;
}): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { groupId, date, payerMemberId, totalAmount, participantIds } = input;

    // Validation nghiệp vụ
    if (!date) return { success: false, error: "Vui lòng chọn ngày" };
    if (!totalAmount || totalAmount <= 0)
      return { success: false, error: "Tổng tiền phải lớn hơn 0" };
    if (participantIds.length === 0)
      return { success: false, error: "Chưa tick ai ăn hôm nay cả! Chọn ít nhất 1 người nhé" };
    if (!payerMemberId)
      return { success: false, error: "Vui lòng chọn người đặt cơm" };

    const perPerson = roundPerPerson(totalAmount, participantIds.length);

    // Món hôm nay (không bắt buộc): nếu chọn từ thực đơn thì lấy tên món
    // từ DB làm snapshot - sau này món đổi tên, lịch sử bữa vẫn giữ tên cũ.
    let foodId: string | null = null;
    let foodNameSnapshot: string | null = null;
    if (input.foodId) {
      const { data: food } = await supabase
        .from("foods")
        .select("id, name")
        .eq("id", input.foodId)
        .maybeSingle();
      if (food) {
        foodId = food.id;
        foodNameSnapshot = food.name;
      }
    } else if (input.foodName?.trim()) {
      foodNameSnapshot = input.foodName.trim();
    }

    const { data: session, error: sessionError } = await supabase
      .from("meal_sessions")
      .insert({
        group_id: groupId,
        date,
        payer_member_id: payerMemberId,
        total_amount: totalAmount,
        participant_count: participantIds.length,
        per_person_amount: perPerson,
        food_id: foodId,
        food_name_snapshot: foodNameSnapshot,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (sessionError || !session)
      return { success: false, error: sessionError?.message ?? "Không tạo được bữa ăn" };

    const { error: participantsError } = await supabase
      .from("meal_participants")
      .insert(
        participantIds.map((memberId) => ({
          session_id: session.id,
          member_id: memberId,
          amount_due: perPerson,
        }))
      );

    if (participantsError) {
      // Rollback thủ công: xóa session vừa tạo (participants cascade theo)
      await supabase.from("meal_sessions").delete().eq("id", session.id);
      return { success: false, error: participantsError.message };
    }

    revalidatePath("/");
    revalidatePath("/meals");
    revalidatePath("/debts");
    return { success: true, message: "Đã lưu bữa ăn! 🍚" };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteMeal(sessionId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("meal_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/meals");
    revalidatePath("/debts");
    return { success: true, message: "Đã xóa bữa ăn" };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ---------- MÓN ĂN ("Hôm nay ăn gì?") ----------

/** Chuẩn hóa URL menu: thêm https:// nếu thiếu, trả về null nếu không hợp lệ */
function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    new URL(withProtocol);
    return withProtocol;
  } catch {
    return null;
  }
}

function validateFoodInput(input: {
  name: string;
  menuUrl: string;
  estimatedPrice: string;
}):
  | { ok: true; name: string; menuUrl: string | null; estimatedPrice: number | null }
  | { ok: false; error: string } {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Tên món không được để trống" };

  let estimatedPrice: number | null = null;
  if (input.estimatedPrice.trim()) {
    const parsed = Number(input.estimatedPrice);
    if (Number.isNaN(parsed) || parsed < 0)
      return { ok: false, error: "Giá tham khảo phải là số >= 0" };
    estimatedPrice = parsed;
  }

  let menuUrl: string | null = null;
  if (input.menuUrl.trim()) {
    menuUrl = normalizeUrl(input.menuUrl);
    if (!menuUrl)
      return { ok: false, error: "Link menu không hợp lệ (ví dụ: https://...)" };
  }

  return { ok: true, name, menuUrl, estimatedPrice };
}

export async function addFood(input: {
  groupId: string;
  name: string;
  note: string;
  menuUrl: string;
  estimatedPrice: string;
  tag: string;
}): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const validated = validateFoodInput(input);
    if (!validated.ok) return { success: false, error: validated.error };

    const { error } = await supabase.from("foods").insert({
      group_id: input.groupId,
      name: validated.name,
      note: input.note.trim() || null,
      menu_url: validated.menuUrl,
      estimated_price: validated.estimatedPrice,
      tag: input.tag.trim() || null,
    });

    if (error) return { success: false, error: error.message };
    revalidatePath("/foods");
    return { success: true, message: `Đã thêm "${validated.name}" vào thực đơn 🍜` };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateFood(input: {
  foodId: string;
  name: string;
  note: string;
  menuUrl: string;
  estimatedPrice: string;
  tag: string;
}): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const validated = validateFoodInput(input);
    if (!validated.ok) return { success: false, error: validated.error };

    const { error } = await supabase
      .from("foods")
      .update({
        name: validated.name,
        note: input.note.trim() || null,
        menu_url: validated.menuUrl,
        estimated_price: validated.estimatedPrice,
        tag: input.tag.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.foodId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/foods");
    return { success: true, message: "Đã cập nhật món" };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Không xóa cứng - chỉ ẩn món (is_active = false) */
export async function setFoodActive(
  foodId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("foods")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", foodId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/foods");
    return {
      success: true,
      message: isActive ? "Đã đưa món trở lại thực đơn" : "Đã ẩn món khỏi thực đơn",
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Chốt món hôm nay: lưu lịch sử + tăng picked_count + cập nhật last_picked_at.
 */
export async function confirmFoodPick(foodId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();

    const { data: food } = await supabase
      .from("foods")
      .select("*")
      .eq("id", foodId)
      .maybeSingle();
    if (!food) return { success: false, error: "Không tìm thấy món này" };
    if (!food.is_active)
      return { success: false, error: "Món này đã bị ẩn khỏi thực đơn" };

    const now = new Date().toISOString();

    const { error: pickError } = await supabase.from("food_picks").insert({
      group_id: food.group_id,
      food_id: food.id,
      food_name_snapshot: food.name,
      picked_at: now,
      picked_by: user.id,
      note: food.note,
    });
    if (pickError) return { success: false, error: pickError.message };

    const { error: updateError } = await supabase
      .from("foods")
      .update({
        picked_count: food.picked_count + 1,
        last_picked_at: now,
        updated_at: now,
      })
      .eq("id", food.id);
    if (updateError) return { success: false, error: updateError.message };

    revalidatePath("/foods");
    return { success: true, message: `Đã chốt món hôm nay: ${food.name} 🍚` };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ---------- THANH TOÁN ----------

export async function createPayment(input: {
  groupId: string;
  memberId: string;
  amount: number;
  paidAt: string;
  note: string;
}): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { groupId, memberId, amount, paidAt, note } = input;

    if (!memberId) return { success: false, error: "Vui lòng chọn thành viên" };
    if (!amount || amount <= 0)
      return { success: false, error: "Số tiền thanh toán phải lớn hơn 0" };
    if (!paidAt) return { success: false, error: "Vui lòng chọn ngày thanh toán" };

    const { error } = await supabase.from("payments").insert({
      group_id: groupId,
      member_id: memberId,
      amount,
      paid_at: paidAt,
      note: note.trim() || null,
      created_by: user.id,
    });

    if (error) return { success: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/payments");
    revalidatePath("/debts");
    return { success: true, message: "Đã ghi nhận thanh toán 💸" };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deletePayment(paymentId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.from("payments").delete().eq("id", paymentId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/payments");
    revalidatePath("/debts");
    return { success: true, message: "Đã xóa thanh toán" };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ---------- AUTH ----------

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

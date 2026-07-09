import type { Member, MemberDebt } from "@/types";

/**
 * CÁCH CHIA TIỀN & LÀM TRÒN:
 *
 * Tiền Việt hiếm khi thu lẻ dưới 500đ, nên mỗi người trả số tiền
 * làm tròn đến 500đ GẦN NHẤT (Math.round(x / 500) * 500).
 *
 * Ví dụ: 250.000đ chia 3 người = 83.333,33đ/người => làm tròn 83.500đ.
 * Tổng thu 250.500đ, lệch +500đ so với thực chi - chấp nhận được.
 *
 * Sai lệch tối đa = 250đ/người, với nhóm 20 người tối đa lệch 5.000đ
 * cho một bữa - đủ nhỏ theo yêu cầu "không lệch nhiều so với tổng tiền".
 * Phần lệch (thừa/thiếu chút ít) coi như người đặt cơm hưởng/chịu.
 */
export const ROUND_UNIT = 500;

export function roundPerPerson(total: number, participantCount: number): number {
  if (participantCount <= 0) return 0;
  const raw = total / participantCount;
  return Math.round(raw / ROUND_UNIT) * ROUND_UNIT;
}

/**
 * Tính công nợ từng thành viên:
 *   còn nợ = tổng tiền các bữa đã ăn - tổng tiền đã thanh toán
 *
 * Nhận dữ liệu thô (đã fetch từ DB) và gộp theo member_id.
 * Nhóm ~20 người nên tính trên client/server bằng JS là đủ nhanh.
 */
export function computeDebts(
  members: Member[],
  participants: { member_id: string; amount_due: number }[],
  payments: { member_id: string; amount: number }[]
): MemberDebt[] {
  const dueByMember = new Map<string, number>();
  for (const p of participants) {
    dueByMember.set(p.member_id, (dueByMember.get(p.member_id) ?? 0) + Number(p.amount_due));
  }

  const paidByMember = new Map<string, number>();
  for (const p of payments) {
    paidByMember.set(p.member_id, (paidByMember.get(p.member_id) ?? 0) + Number(p.amount));
  }

  return members
    .map((member) => {
      const totalDue = dueByMember.get(member.id) ?? 0;
      const totalPaid = paidByMember.get(member.id) ?? 0;
      return { member, totalDue, totalPaid, balance: totalDue - totalPaid };
    })
    .sort((a, b) => b.balance - a.balance);
}

/** Tổng tiền cả nhóm còn phải thu (chỉ tính người đang nợ > 0) */
export function totalOutstanding(debts: MemberDebt[]): number {
  return debts.reduce((sum, d) => (d.balance > 0 ? sum + d.balance : sum), 0);
}

/**
 * Tạo nội dung text tổng hợp công nợ để copy gửi vào Zalo/Telegram/Slack.
 * Chỉ liệt kê thành viên có phát sinh (đã từng ăn hoặc từng trả tiền).
 */
export function buildDebtSummaryText(
  funHeader: string,
  debts: MemberDebt[]
): string {
  const relevant = debts.filter((d) => d.totalDue > 0 || d.totalPaid > 0);
  const owing = relevant.filter((d) => d.balance > 0);
  const clear = relevant.filter((d) => d.balance <= 0);

  const lines: string[] = [`TỔNG HỢP TIỀN ĂN - ${funHeader}`, ""];

  if (owing.length > 0) {
    lines.push("Còn nợ:");
    owing.forEach((d, i) => {
      lines.push(`${i + 1}. ${d.member.name}: ${formatVNDPlain(d.balance)}`);
    });
    lines.push("");
  }

  if (clear.length > 0) {
    lines.push("Đã sạch nợ:");
    clear.forEach((d) => lines.push(`- ${d.member.name} 🎉`));
    lines.push("");
  }

  lines.push(`Tổng cần thu: ${formatVNDPlain(totalOutstanding(debts))}`);
  return lines.join("\n");
}

function formatVNDPlain(amount: number): string {
  return `${Math.round(amount).toLocaleString("vi-VN")}đ`;
}

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { getGroup, getDebtRawData } from "@/lib/data";
import { computeDebts } from "@/lib/debt";

export const dynamic = "force-dynamic";

export default async function NewPaymentPage() {
  const group = await getGroup();
  if (!group) {
    return (
      <AppShell>
        <EmptyState emoji="🏗️" title="Chưa có nhóm" description="Chạy SQL migration trước nhé (xem README)." />
      </AppShell>
    );
  }

  const { members, participants, payments } = await getDebtRawData(group.id);
  // Cho phép ghi nhận thanh toán cả với người đã ẩn (họ vẫn có thể còn nợ cũ)
  const debts = computeDebts(members, participants, payments).filter(
    (d) => d.member.is_active || d.balance > 0
  );

  return (
    <AppShell>
      <PageHeader
        emoji="💸"
        title="Ghi nhận thanh toán"
        description="Ai trả tiền thì ghi vào đây, công nợ tự cập nhật."
      />
      {debts.length === 0 ? (
        <EmptyState
          emoji="🧑‍🍳"
          title="Chưa có thành viên nào"
          description="Thêm thành viên và ghi bữa ăn trước đã nhé!"
        />
      ) : (
        <PaymentForm groupId={group.id} debts={debts} />
      )}
    </AppShell>
  );
}

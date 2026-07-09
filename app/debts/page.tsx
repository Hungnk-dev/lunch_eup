import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DebtBoard } from "@/components/debts/DebtBoard";
import { getGroup, getDebtRawData } from "@/lib/data";
import { computeDebts } from "@/lib/debt";

export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  const group = await getGroup();
  if (!group) {
    return (
      <AppShell>
        <EmptyState emoji="🏗️" title="Chưa có nhóm" description="Chạy SQL migration trước nhé (xem README)." />
      </AppShell>
    );
  }

  const { members, participants, payments } = await getDebtRawData(group.id);
  const debts = computeDebts(members, participants, payments).filter(
    // Chỉ hiện người có phát sinh hoặc đang active
    (d) => d.member.is_active || d.totalDue > 0 || d.totalPaid > 0
  );

  return (
    <AppShell>
      <PageHeader
        emoji="💰"
        title="Bảng công nợ"
        description="Ai nợ bao nhiêu, nhìn phát biết liền."
      />
      {debts.length === 0 ? (
        <EmptyState
          emoji="🕊️"
          title="Chưa có công nợ nào"
          description="Nhóm chưa ghi bữa ăn nào cả. Sổ sách trắng tinh!"
        />
      ) : (
        <DebtBoard
          funHeader={group.fun_header ?? group.name}
          debts={debts}
        />
      )}
    </AppShell>
  );
}

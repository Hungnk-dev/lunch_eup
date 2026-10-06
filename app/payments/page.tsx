import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { PaymentList } from "@/components/payments/PaymentList";
import { PaymentQR } from "@/components/payments/PaymentQR";
import { getGroup, getPayments } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const group = await getGroup();
  if (!group) {
    return (
      <AppShell>
        <EmptyState emoji="🏗️" title="Chưa có nhóm" description="Chạy SQL migration trước nhé (xem README)." />
      </AppShell>
    );
  }

  const payments = await getPayments(group.id);

  return (
    <AppShell>
      <PageHeader
        emoji="💸"
        title="Lịch sử thanh toán"
        description={`${payments.length} lần thanh toán đã ghi nhận`}
        action={
          <Link href="/payments/new">
            <Button>➕ Ghi nhận</Button>
          </Link>
        }
      />
      {group.payment_qr_url && (
        <div className="mb-4">
          <PaymentQR src={group.payment_qr_url} />
        </div>
      )}
      {payments.length === 0 ? (
        <EmptyState
          emoji="🪙"
          title="Chưa ai thanh toán cả"
          description="Khi có người trả tiền, ghi nhận ở đây để trừ công nợ nhé."
          action={
            <Link href="/payments/new">
              <Button>💸 Ghi nhận thanh toán</Button>
            </Link>
          }
        />
      ) : (
        <PaymentList payments={payments} />
      )}
    </AppShell>
  );
}

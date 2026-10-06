import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { PaymentQRUploader } from "@/components/settings/PaymentQRUploader";
import { getGroup } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const group = await getGroup();
  if (!group) {
    return (
      <AppShell>
        <EmptyState emoji="🏗️" title="Chưa có nhóm" description="Chạy SQL migration trước nhé (xem README)." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        emoji="⚙️"
        title="Cài đặt nhóm"
        description="Đổi tên nhóm, header vui và mã QR chuyển khoản."
      />
      <div className="space-y-4">
        <PaymentQRUploader groupId={group.id} qrUrl={group.payment_qr_url} />
        <SettingsForm group={group} />
      </div>
    </AppShell>
  );
}

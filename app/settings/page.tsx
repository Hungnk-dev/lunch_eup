import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SettingsForm } from "@/components/settings/SettingsForm";
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
        description="Đổi tên nhóm và header vui hiển thị trên trang chủ."
      />
      <SettingsForm group={group} />
    </AppShell>
  );
}

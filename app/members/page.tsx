import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { MemberManager } from "@/components/members/MemberManager";
import { getGroup, getMembers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const group = await getGroup();
  if (!group) {
    return (
      <AppShell>
        <EmptyState emoji="🏗️" title="Chưa có nhóm" description="Chạy SQL migration trước nhé (xem README)." />
      </AppShell>
    );
  }

  const members = await getMembers(group.id);

  return (
    <AppShell>
      <PageHeader
        emoji="👥"
        title="Thành viên"
        description="Thêm người mới, sửa tên, ẩn người đã nghỉ."
      />
      <MemberManager groupId={group.id} members={members} />
    </AppShell>
  );
}

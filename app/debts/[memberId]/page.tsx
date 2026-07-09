import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { MemberDebtDetail } from "@/components/debts/MemberDebtDetail";
import { getMemberDebtDetail } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MemberDebtPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const supabase = await createClient();
  const [detail, { data: { user } }] = await Promise.all([
    getMemberDebtDetail(memberId),
    supabase.auth.getUser(),
  ]);

  if (!detail) notFound();

  return (
    <AppShell>
      <MemberDebtDetail
        member={detail.member}
        meals={detail.meals}
        payments={detail.payments}
        isAdmin={!!user}
      />
    </AppShell>
  );
}

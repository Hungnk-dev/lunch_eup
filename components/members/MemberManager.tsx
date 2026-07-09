"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Member } from "@/types";
import { addMember, updateMember, setMemberActive } from "@/app/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";

export function MemberManager({
  groupId,
  members,
}: {
  groupId: string;
  members: Member[];
}) {
  const [isPending, startTransition] = useTransition();

  // Form thêm mới
  const [newName, setNewName] = useState("");
  const [newNote, setNewNote] = useState("");

  // Sửa inline
  const [editing, setEditing] = useState<Member | null>(null);
  const [editName, setEditName] = useState("");
  const [editNote, setEditNote] = useState("");

  // Confirm ẩn thành viên
  const [hiding, setHiding] = useState<Member | null>(null);

  const active = members.filter((m) => m.is_active);
  const hidden = members.filter((m) => !m.is_active);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Nhập tên thành viên đã nhé!");
      return;
    }
    startTransition(async () => {
      const result = await addMember(groupId, newName, newNote);
      if (result.success) {
        toast.success(result.message);
        setNewName("");
        setNewNote("");
      } else {
        toast.error(result.error);
      }
    });
  }

  function startEdit(member: Member) {
    setEditing(member);
    setEditName(member.name);
    setEditNote(member.note ?? "");
  }

  function handleSaveEdit() {
    if (!editing) return;
    if (!editName.trim()) {
      toast.error("Tên không được để trống");
      return;
    }
    startTransition(async () => {
      const result = await updateMember(editing.id, editName, editNote);
      if (result.success) {
        toast.success(result.message);
        setEditing(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleHide() {
    if (!hiding) return;
    startTransition(async () => {
      const result = await setMemberActive(hiding.id, false);
      if (result.success) {
        toast.success(result.message);
        setHiding(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRestore(member: Member) {
    startTransition(async () => {
      const result = await setMemberActive(member.id, true);
      if (result.success) toast.success(`Chào mừng ${member.name} quay lại! 🎉`);
      else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      {/* Thêm thành viên */}
      <Card className="p-4">
        <p className="mb-3 font-bold text-stone-700">➕ Thêm thành viên mới</p>
        <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Tên (bắt buộc)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder="Ghi chú (không bắt buộc)"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
          </div>
          <Button type="submit" loading={isPending}>
            Thêm
          </Button>
        </form>
      </Card>

      {/* Danh sách active */}
      <div>
        <p className="mb-3 font-bold text-stone-700">
          Đang hoạt động ({active.length})
        </p>
        {active.length === 0 ? (
          <EmptyState
            emoji="🧑‍🍳"
            title="Chưa có ai trong nhóm"
            description="Thêm thành viên đầu tiên để bắt đầu ghi bữa ăn nhé!"
          />
        ) : (
          <div className="space-y-2">
            {active.map((member) =>
              editing?.id === member.id ? (
                <Card key={member.id} className="space-y-3 p-4">
                  <Input
                    label="Tên"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <Input
                    label="Ghi chú"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setEditing(null)}>
                      Hủy
                    </Button>
                    <Button onClick={handleSaveEdit} loading={isPending}>
                      Lưu
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card
                  key={member.id}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-stone-800">
                      {member.name}
                    </p>
                    {member.note && (
                      <p className="truncate text-sm text-stone-400">
                        {member.note}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" onClick={() => startEdit(member)}>
                      ✏️ Sửa
                    </Button>
                    <Button variant="ghost" onClick={() => setHiding(member)}>
                      🙈 Ẩn
                    </Button>
                  </div>
                </Card>
              )
            )}
          </div>
        )}
      </div>

      {/* Danh sách đã ẩn */}
      {hidden.length > 0 && (
        <div>
          <p className="mb-3 font-bold text-stone-500">
            Đã ẩn ({hidden.length})
          </p>
          <div className="space-y-2">
            {hidden.map((member) => (
              <Card
                key={member.id}
                className="flex items-center justify-between gap-3 p-4 opacity-70"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-stone-500">
                    {member.name} <Badge tone="neutral">đã ẩn</Badge>
                  </p>
                  {member.note && (
                    <p className="truncate text-sm text-stone-400">{member.note}</p>
                  )}
                </div>
                <Button
                  variant="secondary"
                  onClick={() => handleRestore(member)}
                  loading={isPending}
                >
                  ♻️ Khôi phục
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!hiding}
        title={`Ẩn ${hiding?.name}?`}
        description="Người này sẽ không xuất hiện khi tick người ăn nữa, nhưng lịch sử công nợ vẫn được giữ nguyên. Có thể khôi phục bất cứ lúc nào."
        confirmLabel="Ẩn luôn"
        danger
        loading={isPending}
        onConfirm={handleHide}
        onCancel={() => setHiding(null)}
      />
    </div>
  );
}

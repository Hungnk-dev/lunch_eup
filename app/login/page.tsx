"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Nhập email và mật khẩu đã nhé!");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      toast.error("Đăng nhập thất bại: sai email hoặc mật khẩu");
      return;
    }

    toast.success("Chào mừng quay lại! 🍚");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-rice-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-6xl">🍚</div>
          <h1 className="mt-3 text-3xl font-extrabold text-rice-700">Cơm Chung</h1>
          <p className="mt-1 text-sm text-stone-500">
            Ăn trước, tính sau — nhưng phải tính! 😤
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="admin@congty.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              label="Mật khẩu"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Button type="submit" loading={loading} className="w-full">
              Đăng nhập
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-xs text-stone-400">
          Chỉ admin cần đăng nhập. Cả nhóm xem công nợ qua link chung không cần
          tài khoản.
        </p>
      </div>
    </div>
  );
}

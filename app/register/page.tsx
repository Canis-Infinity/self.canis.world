"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Leaf, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
export default function Page() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    setBusy(true);
    try {
      const password = String(data.get("password") || "");
      if (
        password.length < 12 ||
        new TextEncoder().encode(password).length > 72
      )
        throw new Error("密碼至少 12 個字元，且不可超過 72 bytes");
      if (password !== data.get("confirmPassword"))
        throw new Error("兩次密碼不一致");
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: String(data.get("name")).trim(),
          email: String(data.get("email")).trim(),
          password,
        }),
      });
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-8">
        <Link
          href="/login"
          className="flex items-center gap-2 text-2xl font-semibold"
        >
          <Leaf className="text-primary" />
          self
        </Link>
        {sent ? (
          <section role="status" className="space-y-4">
            <ShieldCheck className="size-10 text-primary" />
            <h1 className="text-3xl font-semibold">申請已送出</h1>
            <p className="text-muted-foreground">請等待管理員核准後再登入。</p>
          </section>
        ) : (
          <>
            <header className="space-y-3">
              <h1 className="text-3xl font-semibold">申請自己的空間</h1>
              <p className="text-muted-foreground">
                填寫資料，管理員核准後即可開始記錄。
              </p>
            </header>
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">名稱</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  maxLength={80}
                  autoComplete="name"
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">電子郵件</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密碼</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                  aria-describedby="password-help"
                  disabled={busy}
                />
                <p id="password-help" className="text-sm text-muted-foreground">
                  至少 12 個字元，最多 72 bytes。
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">確認密碼</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  disabled={busy}
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "送出中…" : "送出註冊申請"}
              </Button>
            </form>
          </>
        )}
        <Link href="/login" className="block text-sm text-primary underline">
          返回登入
        </Link>
        <p className="text-sm text-muted-foreground">
          每個帳號的紀錄皆獨立保存，僅供本人存取。
        </p>
      </div>
    </main>
  );
}

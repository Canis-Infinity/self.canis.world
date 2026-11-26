"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Leaf, Heart, Moon, Activity, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import type { User } from "./auth-context";
export function Login({
  onLogin,
  initialError,
}: {
  onLogin: (user: User) => Promise<void>;
  initialError: string;
}) {
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("self-remember-email");
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    } catch {}
  }, []);
  useEffect(() => {
    if (initialError)
      toast.add({
        title: "暫時無法登入",
        description: initialError,
        type: "error",
      });
  }, [initialError]);
  const [busy, setBusy] = useState(false);
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    setBusy(true);

    try {
      if (!email.trim()) throw new Error("請填寫電子郵件");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        throw new Error("請填寫有效的電子郵件");
      if (!values.get("password")) throw new Error("請填寫密碼");
      const result = await api<{ user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password: values.get("password"),
        }),
      });
      try {
        if (remember) localStorage.setItem("self-remember-email", email.trim());
        else localStorage.removeItem("self-remember-email");
      } catch {}
      await onLogin(result.user);
    } catch (e) {
      toast.add({
        title: "無法登入",
        description: (e as Error).message,
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-primary p-14 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3 text-2xl font-semibold">
          <Leaf />
          self
        </div>
        <div className="max-w-md space-y-6">
          <p className="text-sm tracking-widest opacity-70">
            給自己，一個安靜的空間
          </p>
          <h1 className="text-5xl leading-tight font-semibold">
            日常的小變化，
            <br />
            都值得被記得。
          </h1>
          <p className="text-lg leading-relaxed opacity-80">
            記錄心情、睡眠與身體狀態。
            <br />
            把想說的事整理好，讓每次回診更從容。
          </p>
          <div className="flex gap-4 pt-4">
            <Heart />
            <Moon />
            <Activity />
          </div>
        </div>
        <p className="text-sm opacity-60">私人日誌 · 回診準備 · 自我照顧</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <div className="mb-8 flex items-center gap-2 text-xl font-semibold lg:hidden">
              <Leaf />
              self
            </div>
            <h2 className="text-3xl font-semibold">回到自己的空間</h2>
            <p className="mt-3 text-muted-foreground">
              登入後，繼續記錄今天的你。
            </p>
          </div>
          <form onSubmit={login} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">電子郵件</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={busy}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => {
                  setRemember(checked);
                  if (!checked) {
                    try {
                      localStorage.removeItem("self-remember-email");
                    } catch {}
                  }
                }}
                disabled={busy}
              />
              <Label htmlFor="remember">記住帳號</Label>
            </div>
            <Button className="w-full" type="submit" disabled={busy}>
              {busy ? "登入中…" : "登入"}
            </Button>
          </form>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4" />
            私人使用，不開放公開註冊。
          </p>
        </div>
      </section>
    </main>
  );
}

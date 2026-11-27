"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Loading from "./loading";
type Account = {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  version: number;
};
const labels: Record<string, string> = {
  pending: "待核准",
  approved: "已核准",
  rejected: "已拒絕",
  suspended: "已停用",
};
const transitions: Record<string, string[]> = {
  pending: ["approved", "rejected"],
  approved: ["suspended"],
  rejected: ["approved"],
  suspended: ["approved"],
};
const actions: Record<string, string> = {
  approved: "核准",
  rejected: "拒絕",
  suspended: "停用",
};
export default function Page() {
  const { user, refreshTick } = useAuth();
  const [users, setUsers] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  useEffect(() => {
    if (user?.role !== "admin") return;
    const controller = new AbortController();
    api<{ users: Account[] }>("/admin/users", { signal: controller.signal })
      .then((result) => {
        setUsers(result.users);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [user?.role, refreshTick]);
  async function review(account: Account, status: string) {
    setBusy(account.id);
    setError("");
    try {
      const result = await api<{ user: Account }>(
        `/admin/users/${account.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status, version: account.version }),
        },
      );
      setUsers((current) =>
        current.map((u) => (u.id === account.id ? result.user : u)),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  if (user?.role !== "admin")
    return (
      <main id="main" className="p-6">
        需要管理員權限。
      </main>
    );
  if (loading) return <Loading />;
  return (
    <main id="main" className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <header>
        <h1 className="text-3xl font-semibold">帳號審核</h1>
        <p className="mt-3 text-muted-foreground">
          審核註冊申請，管理帳號使用權限。
        </p>
      </header>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <div className="space-y-3">
        {users.map((account) => (
          <article
            key={account.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5"
          >
            <div className="min-w-0 space-y-1">
              <p className="font-medium">
                {account.name}{" "}
                <Badge variant="secondary">
                  {account.role === "admin" ? "管理員" : labels[account.status]}
                </Badge>
              </p>
              <p className="break-all text-sm text-muted-foreground">
                {account.email}
              </p>
            </div>
            {account.role !== "admin" && (
              <div className="flex gap-2">
                {transitions[account.status]?.map((status) => (
                  <Button
                    key={status}
                    variant={status === "approved" ? "default" : "outline"}
                    disabled={!!busy}
                    onClick={() => review(account, status)}
                  >
                    {busy === account.id ? "處理中…" : actions[status]}
                  </Button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}

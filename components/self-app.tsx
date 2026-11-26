"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "./auth-context";
import { ContentSkeleton } from "./content-skeleton";
import { AppointmentCalendar } from "./appointment-calendar";
import {
  CalendarDays,
  Download,
  FileText,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
} from "@/components/ui/empty";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toast";
import { api, ApiError, getEntries } from "@/lib/api";
import {
  categories,
  moods as moodsLabels,
  kinds,
  dayKey,
  dateLabel,
  summary,
  details,
  type Kind,
  type Entry,
} from "@/lib/records";
import { useIsMobile } from "@/hooks/use-mobile";
import { EntryEditor } from "./entry-editor";
import { DateTimeField } from "./date-time-field";
type View = "dashboard" | "report" | Kind;
export function SelfApp({
  view = "dashboard",
  reportDate,
}: {
  view?: View;
  reportDate?: string;
}) {
  const { user, refreshTick, expire } = useAuth();
  const isMobile = useIsMobile();
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfDownload, setPdfDownload] = useState<{
    url: string;
    filename: string;
  } | null>(null);
  useEffect(
    () => () => {
      if (pdfDownload) URL.revokeObjectURL(pdfDownload.url);
    },
    [pdfDownload],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [records, setRecords] = useState<Entry[]>([]);
  const [editor, setEditor] = useState<{
    kind: Kind;
    record?: Entry;
    date?: Date;
  } | null>(null);
  const [deleting, setDeleting] = useState<Entry | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState(() => {
    const date = reportDate ? new Date(`${reportDate}T12:00:00`) : new Date();
    date.setDate(date.getDate() - 29);
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [to, setTo] = useState(() =>
    reportDate ? new Date(`${reportDate}T12:00:00`) : new Date(),
  );
  const [page, setPage] = useState(1);
  const [includeImages, setIncludeImages] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRecords(await getEntries());
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        expire();
        setRecords([]);
      } else setError(e instanceof Error ? e.message : "無法讀取紀錄");
    } finally {
      setLoading(false);
    }
  }, [expire]);
  useEffect(() => {
    void load();
  }, [load, refreshTick]);
  useEffect(() => {
    setPdfDownload(null);
  }, [from, to, query, includeImages, records]);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  const validRange = from <= end;
  const filtered = useMemo(
    () =>
      records.filter((r) => {
        const timestamp = new Date(r.occurredAt).getTime();
        const last = new Date(to);
        last.setHours(23, 59, 59, 999);
        return (
          timestamp >= from.getTime() &&
          timestamp <= last.getTime() &&
          (view === "report" || view === "dashboard"
            ? r.kind !== "appointment"
            : r.kind === view) &&
          `${r.title} ${summary(r)} ${details(r)} ${r.note}`
            .toLowerCase()
            .includes(query.toLowerCase())
        );
      }),
    [records, from, to, view, query],
  );
  const appointments = records
    .filter((r) => r.kind === "appointment")
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const nextVisit = appointments.find(
    (r) => dayKey(r.occurredAt) >= dayKey(new Date()),
  );
  const moods = filtered.filter((r) => r.kind === "mood");
  const sleeps = filtered.filter((r) => r.kind === "sleep");
  const moodAverage = moods.length
    ? (
        moods.reduce(
          (sum, r) => sum + (r.kind === "mood" ? r.data.score : 0),
          0,
        ) / moods.length
      ).toFixed(1)
    : "—";
  const sleepAverage = sleeps.length
    ? (
        sleeps.reduce(
          (sum, r) =>
            sum +
            (r.kind === "sleep"
              ? (new Date(r.data.wakeAt).getTime() -
                  new Date(r.data.bedtime).getTime()) /
                3600000
              : 0),
          0,
        ) / sleeps.length
      ).toFixed(1)
    : "—";
  const title =
    view === "dashboard"
      ? "我的狀態總覽"
      : view === "report"
        ? "回診摘要"
        : categories[view].label;

  async function remove() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api(`/entries/${deleting.id}`, {
        method: "DELETE",
        body: JSON.stringify({ version: deleting.version }),
      });
      setDeleting(null);
      toast.add({ title: "紀錄已刪除", type: "success" });
      await load();
    } catch (e) {
      toast.add({
        title: "無法刪除",
        description: (e as Error).message,
        type: "error",
      });
    } finally {
      setDeleteBusy(false);
    }
  }
  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            from: from.toISOString(),
            to: end.toISOString(),
            records: filtered,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `self-${dayKey(from)}-${dayKey(to)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.add({
      title: "紀錄已匯出",
      description: "JSON 包含紀錄與附件識別碼；圖片可透過列印摘要一併保存。",
      type: "success",
    });
  }
  function empty(
    label = "這段時間還沒有紀錄",
    description = "從一筆簡單的記錄開始，讓回診時的回顧更容易。",
    kind: Kind = view === "dashboard" || view === "report" ? "mood" : view,
  ) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <NotebookIcon />
          </EmptyMedia>
          <EmptyTitle>{label}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => setEditor({ kind })}>
            <Plus />
            新增記錄
          </Button>
        </EmptyContent>
      </Empty>
    );
  }
  function recordCard(r: Entry, print = false) {
    const Icon = categories[r.kind].icon;
    return (
      <Card key={r.id} className="record-card">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-4" />
                <span>{categories[r.kind].label}</span>
                <span>·</span>
                <time dateTime={r.occurredAt}>
                  {dateLabel(r.occurredAt, r.kind === "appointment")}
                </time>
              </div>
              <CardTitle>{r.title}</CardTitle>
            </div>
            {!print && (
              <div className="flex gap-1 print:hidden">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`編輯 ${r.title}`}
                  onClick={() => setEditor({ kind: r.kind, record: r })}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`刪除 ${r.title}`}
                  onClick={() => setDeleting(r)}
                >
                  <Trash2 />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="whitespace-pre-wrap break-words">{summary(r)}</p>
          {details(r) && (
            <p className="whitespace-pre-wrap break-words text-muted-foreground">
              {details(r)}
            </p>
          )}
          {r.note && (
            <p className="whitespace-pre-wrap break-words border-t pt-3">
              {r.note}
            </p>
          )}
          {r.kind === "appointment" && !print && (
            <Button
              variant="outline"
              render={<Link href={`/report?date=${dayKey(r.occurredAt)}`} />}
            >
              <FileText />
              準備回診前 30 天摘要
            </Button>
          )}
          {r.images.length > 0 && (!print || includeImages) && (
            <div className="flex flex-wrap gap-3">
              {r.images.map((id, i) => (
                <a
                  key={id}
                  href={`/api/self/images/${id}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`查看 ${r.title} 附件 ${i + 1}`}
                >
                  <img
                    src={`/api/self/images/${id}`}
                    alt={`${r.title} 附件 ${i + 1}`}
                    loading={print ? "eager" : "lazy"}
                    className="h-28 w-28 rounded-lg border object-cover print:h-auto print:w-56 print:object-contain"
                  />
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  return (
    <>
      <div
        id="main"
        className={`mx-auto w-full ${view === "appointment" ? "max-w-none" : "max-w-6xl"} space-y-7 px-4 py-6 sm:px-6 print:max-w-none print:p-0`}
      >
        {view !== "appointment" && (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                {view === "dashboard"
                  ? "留一點時間，給自己。"
                  : view === "report"
                    ? "把日常變化整理好，帶去下次回診。"
                    : categories[view].description}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            </div>
            <div className="print:hidden">
              {view === "report" ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={includeImages ? "default" : "outline"}
                    aria-pressed={includeImages}
                    disabled={pdfBusy}
                    onClick={() => setIncludeImages((v) => !v)}
                  >
                    包含圖片：{includeImages ? "包含" : "不包含"}
                  </Button>
                  {isMobile && pdfDownload && (
                    <Button
                      variant="outline"
                      render={
                        <a
                          href={pdfDownload.url}
                          download={pdfDownload.filename}
                        />
                      }
                    >
                      <Download />
                      下載 PDF
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={exportData}
                    disabled={
                      pdfBusy ||
                      loading ||
                      !!error ||
                      !filtered.length ||
                      !validRange
                    }
                  >
                    <Download />
                    匯出 JSON
                  </Button>
                  <Button
                    onClick={async () => {
                      if (isMobile) {
                        setPdfBusy(true);
                        setPdfDownload(null);
                        try {
                          const { createReportPdf } =
                            await import("@/lib/report-pdf");
                          const blob = await createReportPdf({
                            records: filtered,
                            name: user?.name || "",
                            from: dayKey(from),
                            to: dayKey(to),
                            query,
                            includeImages,
                          });
                          const url = URL.createObjectURL(blob);
                          const filename = `回診摘要_${dayKey(from)}_${dayKey(to)}.pdf`;
                          setPdfDownload({ url, filename });
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = filename;
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                          toast.add({
                            title: "PDF 已產生",
                            description: "若未自動下載，請點選「下載 PDF」。",
                            type: "success",
                          });
                        } catch (error) {
                          toast.add({
                            title: "無法匯出 PDF",
                            description:
                              error instanceof Error
                                ? error.message
                                : "請稍後重試",
                            type: "error",
                          });
                        } finally {
                          setPdfBusy(false);
                        }
                        return;
                      }
                      if (includeImages)
                        await Promise.all(
                          Array.from(
                            document.querySelectorAll<HTMLImageElement>(
                              ".record-card img",
                            ),
                          ).map((img) => img.decode().catch(() => {})),
                        );
                      window.print();
                    }}
                    disabled={
                      pdfBusy ||
                      loading ||
                      !!error ||
                      !filtered.length ||
                      !validRange
                    }
                  >
                    {isMobile ? <Download /> : <Printer />}
                    {pdfBusy
                      ? "正在產生 PDF…"
                      : isMobile
                        ? "匯出 PDF"
                        : "列印／PDF"}
                  </Button>
                </div>
              ) : view === "dashboard" ? (
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button />}>
                    <Plus />
                    新增記錄
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {kinds.map((k) => {
                      const Icon = categories[k].icon;
                      return (
                        <DropdownMenuItem
                          key={k}
                          onClick={() => setEditor({ kind: k })}
                        >
                          <Icon />
                          {categories[k].label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => setEditor({ kind: view })}>
                  <Plus />
                  新增記錄
                </Button>
              )}
            </div>
          </div>
        )}
        {view !== "appointment" && (
          <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-background p-4 print:hidden">
            <DateTimeField
              label="開始日期"
              value={from}
              onChange={(d) => {
                d.setHours(0, 0, 0, 0);
                setFrom(d);
                setPage(1);
              }}
              dateOnly
            />
            <DateTimeField
              label="結束日期"
              value={to}
              onChange={(d) => {
                setTo(d);
                setPage(1);
              }}
              dateOnly
            />
            <div className="relative min-w-48 flex-1">
              <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                aria-label="搜尋紀錄"
                placeholder="搜尋標題或紀錄內容"
                className="pl-9"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        )}
        {!validRange && view !== "appointment" && (
          <p role="alert" className="text-destructive">
            開始日期不可晚於結束日期。
          </p>
        )}
        {error ? (
          <Card>
            <CardHeader>
              <CardTitle>暫時無法取得紀錄</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={load}>
                <RefreshCw />
                重新載入
              </Button>
            </CardContent>
          </Card>
        ) : loading ? (
          <ContentSkeleton view={view} />
        ) : (
          <>
            {(view === "dashboard" || view === "report") && (
              <>
                <div className="hidden print:block">
                  <p>
                    {user?.name} · {dayKey(from)} 至 {dayKey(to)} ·{" "}
                    {filtered.length} 筆{query && ` · 搜尋：${query}`}
                  </p>
                  <p>
                    時間依裝置時區：
                    {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    。以下為本人填寫的紀錄，未經醫療判讀。
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    [
                      "已記錄天數",
                      new Set(filtered.map((r) => dayKey(r.occurredAt))).size,
                      "天 · 依目前日期範圍",
                    ],
                    [
                      "平均心情",
                      moodAverage === "—"
                        ? "—"
                        : moodsLabels[
                            Math.max(
                              0,
                              Math.min(4, Math.round(Number(moodAverage)) - 1),
                            )
                          ],
                      `${moods.length} 筆紀錄`,
                    ],
                    [
                      "平均睡眠",
                      sleepAverage,
                      `小時 · ${sleeps.length} 筆紀錄`,
                    ],
                  ].map(([label, value, unit]) => (
                    <Card key={label}>
                      <CardHeader>
                        <CardDescription>{label}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-semibold tabular-nums">
                          {value}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {unit}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
            {view === "dashboard" && (
              <>
                <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle>心情的變化</CardTitle>
                      <CardDescription>最近 14 筆情緒紀錄</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {moods.length ? (
                        <div className="flex h-44 items-end gap-2 overflow-x-auto pt-5">
                          {[...moods]
                            .slice(0, 14)
                            .reverse()
                            .map((r) => (
                              <div
                                className="flex min-w-8 flex-1 flex-col items-center gap-2"
                                key={r.id}
                              >
                                <span className="text-sm">
                                  {r.kind === "mood" &&
                                    moodsLabels[r.data.score - 1]}
                                </span>
                                <div
                                  title={`${dateLabel(r.occurredAt)}：${summary(r)}`}
                                  className="w-full max-w-8 rounded-t bg-primary/75"
                                  style={{
                                    height: `${r.kind === "mood" ? r.data.score * 20 : 0}px`,
                                  }}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {new Date(r.occurredAt).getDate()}日
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="py-12 text-center text-muted-foreground">
                          寫下第一筆心情後，就能看見變化。
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>下次回診</CardTitle>
                      <CardDescription>記得帶上這段時間的觀察</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {nextVisit ? (
                        <>
                          <p className="text-xl font-semibold">
                            {dateLabel(nextVisit.occurredAt, true)}
                          </p>
                          <p>{summary(nextVisit)}</p>
                          <p className="line-clamp-3 text-muted-foreground">
                            {nextVisit.kind === "appointment" &&
                              nextVisit.data.questions}
                          </p>
                          <Button
                            variant="outline"
                            render={<Link href="/report" />}
                          >
                            <FileText />
                            整理回診摘要
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-muted-foreground">
                            尚未安排下一次回診
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => setEditor({ kind: "appointment" })}
                          >
                            <CalendarDays />
                            新增記錄
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">最近的紀錄</h2>
                  <Badge variant="secondary">{filtered.length} 筆</Badge>
                </div>
                <div className="space-y-4">
                  {filtered.length
                    ? filtered.slice(0, 6).map((r) => recordCard(r))
                    : empty()}
                </div>
              </>
            )}
            {view === "appointment" && (
              <AppointmentCalendar
                appointments={appointments}
                onCreate={(date) => setEditor({ kind: "appointment", date })}
                onEdit={(record) => setEditor({ kind: "appointment", record })}
              />
            )}
            {view === "report" && (
              <>
                <p className="text-sm text-muted-foreground print:hidden">
                  {dayKey(from)} 至 {dayKey(to)} · {filtered.length}{" "}
                  筆紀錄。這份摘要僅整理你填寫的內容，方便回診討論。
                </p>

                {filtered.length
                  ? kinds
                      .filter((k) => k !== "appointment")
                      .map((k) => {
                        const group = filtered.filter((r) => r.kind === k);
                        return (
                          <section key={k} className="space-y-4">
                            <h2 className="text-xl font-semibold">
                              {categories[k].label}{" "}
                              <span className="text-sm font-normal text-muted-foreground">
                                {group.length} 筆
                              </span>
                            </h2>
                            {group.length ? (
                              group.map((r) => recordCard(r, true))
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                此期間無紀錄。
                              </p>
                            )}
                          </section>
                        );
                      })
                  : empty()}
              </>
            )}
            {view !== "dashboard" &&
              view !== "report" &&
              view !== "appointment" && (
                <>
                  <p className="text-sm text-muted-foreground">
                    共 {filtered.length} 筆紀錄
                  </p>
                  <div className="space-y-4">
                    {filtered.length
                      ? filtered
                          .slice((page - 1) * 20, page * 20)
                          .map((r) => recordCard(r))
                      : empty()}
                  </div>
                  {filtered.length > 20 && (
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        <ChevronLeft />
                        上一頁
                      </Button>
                      <span>
                        {page} / {Math.ceil(filtered.length / 20)}
                      </span>
                      <Button
                        variant="outline"
                        disabled={page >= Math.ceil(filtered.length / 20)}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        下一頁
                        <ChevronRight />
                      </Button>
                    </div>
                  )}
                </>
              )}
          </>
        )}
        <footer className="border-t pt-5 text-sm text-muted-foreground print:hidden">
          慢慢記錄，不必完美。時間依裝置時區顯示，資料儲存在你的私人帳號。
        </footer>
      </div>
      {editor && (
        <EntryEditor
          kind={editor.kind}
          record={editor.record}
          initialDate={editor.date}
          onClose={() => setEditor(null)}
          onSaved={load}
          onDelete={
            editor.record
              ? () => {
                  setDeleting(editor.record!);
                  setEditor(null);
                }
              : undefined
          }
        />
      )}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && !deleteBusy && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除這筆紀錄？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleting?.title}」刪除後無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>取消</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteBusy}
              onClick={remove}
            >
              {deleteBusy ? "刪除中…" : "確認刪除"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
function NotebookIcon() {
  return <FileText />;
}

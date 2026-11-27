"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { flushSync } from "react-dom";
import { RecordPagination } from "./record-pagination";
import { useAuth } from "./auth-context";
import { ContentSkeleton } from "./content-skeleton";
import { AppointmentCalendar } from "./appointment-calendar";
import {
  CalendarDays,
  Heart,
  Moon,
  Utensils,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Pencil,
  Trash2,
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
  moodScore,
  scoreColor,
  kinds,
  dayKey,
  dateLabel,
  summary,
  type Kind,
  type Entry,
} from "@/lib/records";
import { ReportExport } from "./report-export";
import { MoodTrend, type TrendPeriod } from "./mood-trend";
import { ImageGallery } from "./image-gallery";
import { RecordContent } from "./record-content";
import { EntryEditor } from "./entry-editor";
import { DateRangeField } from "./date-range-field";
type View = "dashboard" | "report" | Kind;
export function SelfApp({
  view = "dashboard",
  reportDate,
}: {
  view?: View;
  reportDate?: string;
}) {
  const { user, refreshTick, expire } = useAuth();
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
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>("day");
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [includeImages, setIncludeImages] = useState(false);
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [stats, setStats] = useState<{
    days: number;
    moodCount: number;
    moodAverage: number | null;
    sleepCount: number;
    sleepAverage: number | null;
    appetiteCount: number;
    appetiteAverage: number | null;
    nextVisit: Entry | null;
  } | null>(null);
  const [exportRecords, setExportRecords] = useState<Entry[] | null>(null);
  const requestId = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    if (query === search) return;
    const timer = setTimeout(() => {
      setSearch(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);
  const params = useMemo(() => {
    const start =
      view === "appointment"
        ? new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay())
        : from;
    const end =
      view === "appointment"
        ? new Date(month.getFullYear(), month.getMonth() + 1, 0)
        : new Date(to);
    if (view === "appointment") end.setDate(end.getDate() + 6 - end.getDay());
    end.setHours(23, 59, 59, 999);
    return new URLSearchParams({
      from: start.toISOString(),
      to: end.toISOString(),
      kind: view === "dashboard" || view === "report" ? "journal" : view,
      q: view === "appointment" ? "" : search,
    }).toString();
  }, [view, from, to, search, month]);
  const load = useCallback(
    async (background = false) => {
      activeRequest.current?.abort();
      const controller = new AbortController();
      activeRequest.current = controller;
      const id = ++requestId.current;
      if (!background) setLoading(true);
      setError("");
      try {
        if (view === "appointment") {
          const entries = await getEntries(controller.signal, params);
          if (id === requestId.current) setRecords(entries);
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const extras = new URLSearchParams({
            page: String(page),
            limit: String(pageSize),
            ...(view === "dashboard" || view === "report"
              ? {
                  stats: "1",
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  today: today.toISOString(),
                }
              : {}),
          });
          const result = await api<{
            entries: Entry[];
            total: number;
            page: number;
            pages: number;
            stats?: typeof stats;
          }>(`/entries?${params}&${extras}`, { signal: controller.signal });
          if (id !== requestId.current) return;
          setRecords(result.entries);
          setTotal(result.total);
          setPages(result.pages);
          setPage(result.page);
          setStats(result.stats || null);
        }
      } catch (e) {
        if (controller.signal.aborted || id !== requestId.current) return;
        if (e instanceof ApiError && e.status === 401) {
          expire();
          setRecords([]);
        } else setError(e instanceof Error ? e.message : "無法讀取紀錄");
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [expire, view, params, page, pageSize],
  );
  useEffect(() => {
    void load();
    return () => {
      activeRequest.current?.abort();
    };
  }, [load, refreshTick]);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  const validRange = from <= end;
  const filtered = exportRecords || records;
  const appointments = records;
  const nextVisit = stats?.nextVisit;
  const moodAverage =
    stats?.moodAverage == null ? "—" : stats.moodAverage.toFixed(1);
  const sleepAverage =
    stats?.sleepAverage == null ? "—" : stats.sleepAverage.toFixed(1);
  const appetiteAverage =
    stats?.appetiteAverage == null ? "—" : stats.appetiteAverage.toFixed(1);
  async function prepareExport() {
    const entries = await getEntries(undefined, params);
    flushSync(() => setExportRecords(entries));
    return entries;
  }
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
      await load(true);
      setRevision((value) => value + 1);
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
    const rating =
      r.kind === "mood"
        ? moodScore(r.data)
        : r.kind === "diet"
          ? r.data.appetite
          : null;
    return (
      <Card
        key={r.id}
        className={`record-card ${rating !== null ? "border-l-4" : ""}`}
        style={
          rating !== null ? { borderLeftColor: scoreColor(rating) } : undefined
        }
      >
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
              {r.kind === "appointment" && <CardTitle>{r.title}</CardTitle>}
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
          <RecordContent record={r} />
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
            <ImageGallery
              images={r.images}
              title={r.title}
              print={!!exportRecords}
            />
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
                <ReportExport
                  records={records}
                  total={total}
                  prepare={prepareExport}
                  onFinish={() => setExportRecords(null)}
                  name={user?.name || ""}
                  from={from}
                  to={to}
                  query={query}
                  includeImages={includeImages}
                  onImagesChange={setIncludeImages}
                  disabled={
                    loading || !!error || !filtered.length || !validRange
                  }
                />
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
          <div className="grid min-w-0 items-end gap-4 rounded-xl border bg-background p-4 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] print:hidden">
            <DateRangeField
              from={from}
              to={to}
              onChange={(start, end) => {
                setFrom(start);
                setTo(end);
                setPage(1);
              }}
            />
            <div className="relative min-w-0">
              <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                aria-label="搜尋紀錄"
                placeholder="搜尋標題或紀錄內容"
                maxLength={200}
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
              <Button onClick={() => void load()}>
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
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: "已記錄天數",
                      value: stats?.days || 0,
                      unit: "天 · 依目前日期範圍",
                      icon: CalendarDays,
                    },
                    {
                      label: "平均心情",
                      value:
                        view === "dashboard" || moodAverage === "—"
                          ? moodAverage
                          : `${moodAverage} / 10`,
                      unit: `${stats?.moodCount || 0} 筆紀錄`,
                      icon: Heart,
                    },
                    {
                      label: "平均睡眠",
                      value: sleepAverage,
                      unit: `小時 · ${stats?.sleepCount || 0} 筆紀錄`,
                      icon: Moon,
                    },
                    {
                      label: "平均食慾",
                      value:
                        view === "dashboard" || appetiteAverage === "—"
                          ? appetiteAverage
                          : `${appetiteAverage} / 10`,
                      unit: `${stats?.appetiteCount || 0} 筆紀錄`,
                      icon: Utensils,
                    },
                  ].map(({ label, value, unit, icon: Icon }) => (
                    <Card key={label}>
                      <CardHeader>
                        <CardDescription className="flex items-center gap-2">
                          <Icon
                            className="size-4 shrink-0"
                            aria-hidden="true"
                          />
                          {label}
                        </CardDescription>
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
                  <MoodTrend
                    rangeFrom={from}
                    rangeTo={to}
                    search={search}
                    period={trendPeriod}
                    onPeriodChange={setTrendPeriod}
                    revision={revision + refreshTick}
                  />
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
                  <Badge variant="secondary">共 {total} 筆</Badge>
                </div>
                <div className="space-y-4">
                  {filtered.length
                    ? filtered.map((r) => recordCard(r))
                    : empty()}
                </div>
              </>
            )}
            {view === "appointment" && (
              <AppointmentCalendar
                month={month}
                setMonth={setMonth}
                appointments={appointments}
                onCreate={(date) => setEditor({ kind: "appointment", date })}
                onEdit={(record) => setEditor({ kind: "appointment", record })}
              />
            )}
            {view === "report" && (
              <>
                <p className="text-sm text-muted-foreground print:hidden">
                  {dayKey(from)} 至 {dayKey(to)} · {total}{" "}
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
                                {group.length} 筆{!exportRecords && "（本頁）"}
                              </span>
                            </h2>
                            {group.length ? (
                              group.map((r) => recordCard(r, true))
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {exportRecords
                                  ? "此期間無紀錄。"
                                  : "本頁無此類紀錄。"}
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
                    共 {total} 筆紀錄
                  </p>
                  <div className="space-y-4">
                    {filtered.length
                      ? filtered.map((r) => recordCard(r))
                      : empty()}
                  </div>
                </>
              )}
            {view !== "appointment" && !exportRecords && (
              <RecordPagination
                page={page}
                pages={pages}
                total={total}
                pageSize={pageSize}
                onChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
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
          onSaved={async () => {
            await load(true);
            setRevision((value) => value + 1);
          }}
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

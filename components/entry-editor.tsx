"use client";
import { z } from "zod";
import { useState, type FormEvent } from "react";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ImageAttachments, type Attachment } from "./image-attachments";
import { toast, Toaster, createToastManager } from "@/components/ui/toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DateTimeField } from "./date-time-field";
import { api } from "@/lib/api";
import { entry } from "@/lib/schema";
import {
  categories,
  medicationPeriods,
  appointmentSessions,
  moodScore,
  meals,
  metrics,
  units,
  type Entry,
  type Kind,
} from "@/lib/records";

export function EntryEditor({
  kind,
  record,
  initialDate,
  onClose,
  onSaved,
  onDelete,
}: {
  kind: Kind;
  record?: Entry;
  initialDate?: Date;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onDelete?: () => void;
}) {
  const [date, setDate] = useState(() =>
    record ? new Date(record.occurredAt) : initialDate || new Date(),
  );
  const [bedtime, setBedtime] = useState(() =>
    record?.kind === "sleep" ? new Date(record.data.bedtime) : new Date(),
  );
  const [wakeAt, setWakeAt] = useState(() =>
    record?.kind === "sleep" ? new Date(record.data.wakeAt) : new Date(),
  );
  const [data, setData] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(
        record?.kind === "mood"
          ? { ...record.data, score: moodScore(record.data) }
          : record?.kind === "diet"
            ? {
                ...record.data,
                food: [
                  record.data.food,
                  record.data.drinks && `飲料：${record.data.drinks}`,
                ]
                  .filter(Boolean)
                  .join("\n"),
                drinks: "",
              }
            : record?.data || {},
      ).map(([k, v]) => [k, String(v)]),
    ),
  );
  const [title, setTitle] = useState(
    record?.title ||
      (kind === "appointment" ? "身心科回診" : categories[kind].label),
  );
  const [note, setNote] = useState(record?.note || "");
  const [attachments, setAttachments] = useState<Attachment[]>(() =>
    (record?.images || []).map((id, i) => ({
      key: id,
      id,
      name: `照片 ${i + 1}`,
    })),
  );
  const images = attachments.flatMap((a) => (a.id ? [a.id] : []));
  const [busy, setBusy] = useState(false);
  const [formToast] = useState(createToastManager);
  const set = (key: string, value: string) =>
    setData((d) => ({ ...d, [key]: value }));
  function field(
    key: string,
    label: string,
    opts: {
      required?: boolean;
      type?: string;
      placeholder?: string;
      multiline?: boolean;
      max?: number;
    } = {},
  ) {
    const props = {
      id: key,
      value: data[key] || "",
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => set(key, e.target.value),
      required: opts.required,
      placeholder: opts.placeholder,
      maxLength: opts.max || 1000,
    };
    return (
      <div className="space-y-2">
        <Label htmlFor={key}>
          {label}
          {opts.required && " *"}
        </Label>
        {opts.multiline ? (
          <Textarea {...props} rows={4} />
        ) : (
          <Input {...props} type={opts.type || "text"} step="any" />
        )}
      </div>
    );
  }
  function tenPoint(
    key: string,
    label: string,
    low: string,
    high: string,
    min = 1,
  ) {
    const value = Number(data[key] ?? (min === 0 ? 0 : 5));
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Label id={`${key}-label`}>{label} *</Label>
          <Badge variant="secondary">{value} / 10</Badge>
        </div>
        <Slider
          id={key}
          min={min}
          max={10}
          step={1}
          value={[value]}
          disabled={busy}
          onValueChange={(next) =>
            set(key, String(Array.isArray(next) ? next[0] : next))
          }
          aria-labelledby={`${key}-label`}
          aria-describedby={`${key}-hint`}
        />
        <div
          id={`${key}-hint`}
          className="flex justify-between gap-4 text-sm text-muted-foreground"
        >
          <span>{low}</span>
          <span>{high}</span>
        </div>
      </div>
    );
  }
  function score(key: string, label: string, labels: string[]) {
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{label} *</legend>
        <div className="flex flex-wrap gap-2">
          {labels.map((label, i) => (
            <Button
              key={label}
              type="button"
              variant={data[key] === String(i + 1) ? "default" : "outline"}
              aria-pressed={data[key] === String(i + 1)}
              onClick={() => set(key, String(i + 1))}
            >
              {label}
            </Button>
          ))}
        </div>
      </fieldset>
    );
  }
  function radio(
    key: string,
    label: string,
    options: Record<string, string>,
    optional = false,
  ) {
    return (
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">
          {label}
          {!optional && " *"}
        </legend>
        <RadioGroup
          aria-label={label}
          value={data[key] || ""}
          onValueChange={(value) => set(key, String(value))}
          className="flex flex-wrap gap-5"
        >
          {Object.entries(options).map(([value, text]) => (
            <div key={value} className="flex items-center gap-2">
              <RadioGroupItem id={key + value} value={value} />
              <Label htmlFor={key + value}>{text}</Label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>
    );
  }
  async function save(e: FormEvent) {
    e.preventDefault();

    setBusy(true);
    try {
      let values: unknown = data;
      switch (kind) {
        case "mood":
          values = {
            score: Number(data.score ?? 5),
            selfHarmUrge: Number(data.selfHarmUrge ?? 0),
            suicideUrge: Number(data.suicideUrge ?? 0),
            selfHarmed: data.selfHarmed
              ? data.selfHarmed === "true"
              : undefined,
            suicideAttempted: data.suicideAttempted
              ? data.suicideAttempted === "true"
              : undefined,
            scale: 10,
            ...(record?.kind === "mood" && {
              legacyScore:
                record.data.legacyScore ??
                (record.data.scale !== 10 ? record.data.score : undefined),
            }),
            emotions: data.emotions || "",
            trigger: data.trigger || "",
          };
          break;
        case "diet":
          values = {
            meal: data.meal,
            food: data.food || "",
            drinks: data.drinks || "",
            appetite: Number(data.appetite ?? 5),
          };
          break;
        case "sleep":
          values = {
            bedtime: bedtime.toISOString(),
            wakeAt: wakeAt.toISOString(),
            quality: Number(data.quality),
          };
          break;
        case "body":
          values = {
            metric: data.metric || "weight",
            value: Number(data.value),
            unit: data.unit ?? "kg",
          };
          break;
        case "medication":
          values = {
            ...record?.data,
            period: data.period,
            status: data.status,
            reaction: data.reaction || "",
          };
          break;
        case "reflection":
          values = {
            prompt: data.prompt || "",
            content: data.content || "",
            gratitude: data.gratitude || "",
          };
          break;
        case "appointment":
          values = {
            ...record?.data,
            session: data.session,
            number: data.number || "",
            questions: data.questions || "",
          };
          break;
      }
      const parsed = entry.safeParse(
        {
          kind,
          title: kind === "appointment" ? title : categories[kind].label,
          occurredAt: (kind === "appointment"
            ? new Date(date.getFullYear(), date.getMonth(), date.getDate())
            : date
          ).toISOString(),
          note,
          images,
          data: values,
        },
        { error: z.locales.zhTW().localeError },
      );
      if (!parsed.success)
        throw new Error(parsed.error.issues[0]?.message || "請檢查欄位");
      if (attachments.length > 4) throw new Error("每筆紀錄最多 4 張圖片");
      const uploaded: string[] = [];
      for (const attachment of attachments) {
        if (attachment.id) {
          uploaded.push(attachment.id);
          continue;
        }
        const body = new FormData();
        body.append("file", attachment.file!);
        const result = await api<{ id: string }>("/images", {
          method: "POST",
          body,
        });
        uploaded.push(result.id);
        setAttachments((old) =>
          old.map((a) =>
            a.key === attachment.key
              ? { key: a.key, id: result.id, name: a.name }
              : a,
          ),
        );
      }
      await api(record ? `/entries/${record.id}` : "/entries", {
        method: record ? "PUT" : "POST",
        body: JSON.stringify({
          ...parsed.data,
          images: uploaded,
          ...(record && { version: record.version }),
        }),
      });
      toast.add({
        title: record ? "紀錄已更新" : "紀錄已儲存",
        type: "success",
      });
      await onSaved();
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : "儲存失敗";
      formToast.add({
        title: "請檢查紀錄內容",
        description: message,
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="max-h-[90svh] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {record ? "編輯" : "新增"}
            {categories[kind].label}
          </DialogTitle>
          <DialogDescription>
            {categories[kind].description}。星號為必填。
          </DialogDescription>
        </DialogHeader>
        <Toaster toastManager={formToast}>
          <form
            id="entry-editor-form"
            className="min-h-0 space-y-6 overflow-y-auto px-1 py-1"
            onSubmit={save}
            noValidate
          >
            <fieldset disabled={busy} className="space-y-6">
              {kind === "appointment" && (
                <div className="space-y-2">
                  <Label htmlFor="entry-title">標題 *</Label>
                  <Input
                    id="entry-title"
                    required
                    maxLength={120}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              )}
              <DateTimeField
                label={kind === "appointment" ? "回診日期" : "紀錄日期與時間"}
                value={date}
                dateOnly={kind === "appointment"}
                onChange={setDate}
              />
              {kind === "mood" && (
                <>
                  {tenPoint("score", "此刻心情", "很低落", "很好")}
                  {tenPoint("selfHarmUrge", "自傷傾向", "沒有", "非常強烈", 0)}
                  {tenPoint("suicideUrge", "自殺傾向", "沒有", "非常強烈", 0)}
                  <p className="text-sm text-muted-foreground">
                    以下記錄這次日誌時段內的情況，未填寫不代表沒有。
                  </p>
                  {radio(
                    "selfHarmed",
                    "是否曾自傷",
                    { false: "無", true: "有", "": "未填寫" },
                    true,
                  )}
                  {radio(
                    "suicideAttempted",
                    "是否曾嘗試自殺",
                    { false: "無", true: "有", "": "未填寫" },
                    true,
                  )}
                  {field("emotions", "感受關鍵字", {
                    placeholder: "例如：焦慮、安心、疲憊",
                    max: 200,
                  })}
                  {field("trigger", "發生了什麼事？", { multiline: true })}
                </>
              )}
              {kind === "sleep" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DateTimeField
                      label="入睡時間"
                      value={bedtime}
                      onChange={setBedtime}
                    />
                    <DateTimeField
                      label="起床時間"
                      value={wakeAt}
                      onChange={setWakeAt}
                    />
                  </div>
                  {score("quality", "睡眠品質", [
                    "很差",
                    "較差",
                    "普通",
                    "不錯",
                    "很好",
                  ])}
                </>
              )}
              {kind === "body" && (
                <>
                  <div className="space-y-2">
                    <Label id="metric-label">量測項目 *</Label>
                    <Select
                      value={data.metric || "weight"}
                      onValueChange={(v) => {
                        if (v)
                          setData((d) => ({
                            ...d,
                            metric: v,
                            unit: units[v as keyof typeof units],
                          }));
                      }}
                    >
                      <SelectTrigger aria-labelledby="metric-label">
                        <SelectValue>
                          {
                            metrics[
                              (data.metric || "weight") as keyof typeof metrics
                            ]
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(metrics).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            <Activity />
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {field("value", "數值", { type: "number", required: true })}
                    <div className="space-y-2">
                      <Label htmlFor="unit">單位 *</Label>
                      <Input
                        id="unit"
                        required
                        value={data.unit ?? "kg"}
                        maxLength={30}
                        onChange={(e) => set("unit", e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
              {kind === "medication" && (
                <>
                  {radio("period", "用藥時段", medicationPeriods)}
                  {radio("status", "是否服用", {
                    taken: "已服用",
                    skipped: "未服用",
                  })}
                  {field("reaction", "用藥後反應／不適", {
                    multiline: true,
                    placeholder: "例如：服用後約一小時覺得頭暈",
                    max: 2000,
                  })}
                </>
              )}
              {kind === "diet" && (
                <>
                  {radio("meal", "餐別", meals)}
                  {field(
                    "food",
                    data.meal === "drink" ? "喝了什麼" : "吃了什麼",
                    { multiline: true, required: true, max: 4100 },
                  )}
                  {tenPoint("appetite", "食慾", "沒有食慾", "食慾旺盛")}
                </>
              )}
              {kind === "reflection" && (
                <>
                  {field("content", "我的想法", {
                    required: true,
                    multiline: true,
                    max: 10000,
                  })}
                </>
              )}
              {kind === "appointment" && (
                <>
                  {radio("session", "看診時段", appointmentSessions)}
                  {field("number", "看診號碼", {
                    max: 30,
                    placeholder: "例如：25",
                  })}
                  {field("questions", "想討論的事", {
                    multiline: true,
                    max: 5000,
                  })}
                </>
              )}
              {kind !== "reflection" && kind !== "appointment" && (
                <div className="space-y-2">
                  <Label htmlFor="entry-note">補充備註</Label>
                  <Textarea
                    id="entry-note"
                    rows={3}
                    maxLength={10000}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              )}
              {kind !== "appointment" && (
                <ImageAttachments
                  value={attachments}
                  onChange={setAttachments}
                  disabled={busy}
                  onReject={(message) =>
                    formToast.add({
                      title: "無法加入圖片",
                      description: message,
                      type: "error",
                    })
                  }
                />
              )}
            </fieldset>
          </form>
          <DialogFooter>
            {onDelete && (
              <Button
                type="button"
                variant="destructive"
                className="mr-auto"
                disabled={busy}
                onClick={onDelete}
              >
                刪除紀錄
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              取消
            </Button>
            <Button type="submit" form="entry-editor-form" disabled={busy}>
              {busy ? "儲存中…" : "儲存紀錄"}
            </Button>
          </DialogFooter>
        </Toaster>
      </DialogContent>
    </Dialog>
  );
}

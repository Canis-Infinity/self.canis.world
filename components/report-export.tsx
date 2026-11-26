"use client";
import { useEffect, useState } from "react";
import { Download, FileText, Printer, Braces } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Toaster, createToastManager } from "@/components/ui/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { dayKey, type Entry } from "@/lib/records";

export function ReportExport({
  records,
  name,
  from,
  to,
  query,
  includeImages,
  onImagesChange,
  disabled,
}: {
  records: Entry[];
  name: string;
  from: Date;
  to: Date;
  query: string;
  includeImages: boolean;
  onImagesChange: (value: boolean) => void;
  disabled: boolean;
}) {
  const mobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState("pdf");
  const [busy, setBusy] = useState(false);
  const [download, setDownload] = useState<{
    url: string;
    filename: string;
  } | null>(null);
  const [manager] = useState(createToastManager);
  useEffect(
    () => () => {
      if (download) URL.revokeObjectURL(download.url);
    },
    [download],
  );
  useEffect(
    () => setDownload(null),
    [records, from, to, query, includeImages, format],
  );
  useEffect(() => {
    if (mobile && format === "print") setFormat("pdf");
  }, [mobile, format]);
  async function confirmExport() {
    setBusy(true);
    setDownload(null);
    try {
      if (format === "print" && !mobile) {
        if (includeImages)
          await Promise.all(
            Array.from(
              document.querySelectorAll<HTMLImageElement>(".record-card img"),
            ).map((image) => image.decode()),
          );
        setOpen(false);
        // Allow the dialog exit animation to finish before printing the page.
        await new Promise((resolve) => setTimeout(resolve, 200));
        window.print();
        return;
      }
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      const blob =
        format === "json"
          ? new Blob(
              [
                JSON.stringify(
                  {
                    exportedAt: new Date().toISOString(),
                    from: from.toISOString(),
                    to: end.toISOString(),
                    records,
                  },
                  null,
                  2,
                ),
              ],
              { type: "application/json" },
            )
          : await (await import("@/lib/report-pdf")).createReportPdf();
      const filename = `回診摘要_${dayKey(from)}_${dayKey(to)}.${format === "json" ? "json" : "pdf"}`;
      const url = URL.createObjectURL(blob);
      setDownload({ url, filename });
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      manager.add({
        title: "報表已產生",
        description: "若未自動下載，請點選下方下載檔案。",
        type: "success",
      });
    } catch (error) {
      manager.add({
        title: "無法匯出報表",
        description: error instanceof Error ? error.message : "請稍後重試",
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }
  const formats = [
    {
      value: "pdf",
      label: "PDF",
      description: "產生可下載的回診摘要，適合儲存或提供醫師查看。",
      icon: FileText,
    },
    {
      value: "json",
      label: "JSON",
      description: "匯出原始紀錄資料；附件僅保留識別碼，不包含圖片檔案。",
      icon: Braces,
    },
    ...(!mobile
      ? [
          {
            value: "print",
            label: "列印",
            description: "開啟瀏覽器列印視窗，也可另存為 PDF。",
            icon: Printer,
          },
        ]
      : []),
  ];
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) setOpen(value);
      }}
    >
      <Button disabled={disabled} onClick={() => setOpen(true)}>
        <Download />
        匯出報表
      </Button>
      <DialogContent className="flex max-h-[90svh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>匯出回診摘要</DialogTitle>
          <DialogDescription>
            請確認目前套用的篩選條件，並選擇輸出格式。
          </DialogDescription>
        </DialogHeader>
        <Toaster toastManager={manager}>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto py-2">
            <dl className="divide-y overflow-hidden rounded-lg border">
              {[
                ["日期區間", `${dayKey(from)} 至 ${dayKey(to)}`],
                ["搜尋關鍵字", query || "全部關鍵字"],
                ["紀錄筆數", `${records.length} 筆`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid gap-1 p-4 sm:grid-cols-[140px_1fr]"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="break-words font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <fieldset disabled={busy} className="space-y-3">
              <legend className="mb-3 font-medium">輸出方式</legend>
              <RadioGroup
                value={format}
                onValueChange={(value) => setFormat(String(value))}
                aria-label="輸出方式"
              >
                {formats.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`export-${option.value}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${format === option.value ? "border-primary bg-primary/5" : ""}`}
                  >
                    <option.icon className="mt-0.5 size-5 shrink-0" />
                    <span className="min-w-0 flex-1 space-y-2">
                      <span className="block font-medium">{option.label}</span>
                      <span className="block text-sm leading-relaxed font-normal text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                    <RadioGroupItem
                      id={`export-${option.value}`}
                      value={option.value}
                    />
                  </Label>
                ))}
              </RadioGroup>
            </fieldset>
            {format !== "json" && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="export-images"
                  checked={includeImages}
                  disabled={busy}
                  onCheckedChange={(value) => onImagesChange(Boolean(value))}
                />
                <Label htmlFor="export-images">包含圖片附件</Label>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4 shrink-0">
            {download && (
              <Button
                variant="outline"
                render={<a href={download.url} download={download.filename} />}
              >
                <Download />
                下載檔案
              </Button>
            )}
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button disabled={busy || disabled} onClick={confirmExport}>
              <Download />
              {busy
                ? "正在產生報表…"
                : format === "print"
                  ? "確認列印"
                  : "確認匯出"}
            </Button>
          </DialogFooter>
        </Toaster>
      </DialogContent>
    </Dialog>
  );
}

import { jsPDF } from "jspdf";
import {
  categories,
  kinds,
  summary,
  details,
  dateLabel,
  type Entry,
} from "./records";

// Render one A4 page at a time so long reports do not require a tall mobile canvas.
export async function createReportPdf(options: {
  records: Entry[];
  name: string;
  from: string;
  to: string;
  query: string;
  includeImages: boolean;
}) {
  await document.fonts.ready;
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("此瀏覽器無法產生 PDF，請改用其他瀏覽器");
  const context = ctx;
  const margin = 90,
    bottom = 1640,
    width = 1060;
  let y = margin,
    page = 0;
  function reset() {
    context.fillStyle = "white";
    context.fillRect(0, 0, 1240, 1754);
    y = margin;
  }
  function flush() {
    context.font = "20px sans-serif";
    context.fillStyle = "#666";
    context.fillText(`self · ${options.from} — ${options.to}`, margin, 1690);
    context.fillText(`${++page}`, 1120, 1690);
    if (page > 1) pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", 0, 0, 210, 297);
    reset();
  }
  function room(height: number) {
    if (y + height > bottom) flush();
  }
  function text(value: string, size = 25, bold = false, color = "#222") {
    const lineHeight = size * 1.65;
    function line(value: string) {
      room(lineHeight);
      context.font = `${bold ? "600" : "400"} ${size}px "Microsoft JhengHei", "PingFang TC", sans-serif`;
      context.fillStyle = color;
      context.fillText(value, margin, y + size);
      y += lineHeight;
    }
    for (const paragraph of value.split(/\r?\n/)) {
      let buffer = "";
      for (const char of Array.from(paragraph)) {
        context.font = `${bold ? "600" : "400"} ${size}px "Microsoft JhengHei", "PingFang TC", sans-serif`;
        if (context.measureText(buffer + char).width > width && buffer) {
          line(buffer);
          buffer = "";
        }
        buffer += char;
      }
      line(buffer);
    }
  }
  reset();
  text("回診摘要", 42, true);
  text(`${options.name} · ${options.from} 至 ${options.to}`, 24);
  if (options.query) text(`搜尋條件：${options.query}`, 22);
  const records = options.records.filter((r) => r.kind !== "appointment");
  const moods = records.filter((r) => r.kind === "mood");
  const sleeps = records.filter((r) => r.kind === "sleep");
  text(
    `共 ${records.length} 筆紀錄 · 情緒 ${moods.length} 筆 · 睡眠 ${sleeps.length} 筆`,
    23,
  );
  text(`時區：${Intl.DateTimeFormat().resolvedOptions().timeZone}`, 20);
  text(
    "以下僅整理本人填寫的內容，方便回診討論，未經醫療判讀。",
    21,
    false,
    "#666",
  );
  y += 20;
  for (const kind of kinds.filter((k) => k !== "appointment")) {
    const group = records.filter((r) => r.kind === kind);
    room(160);
    text(`${categories[kind].label} · ${group.length} 筆`, 30, true);
    if (!group.length) text("此期間無紀錄。", 23, false, "#666");
    for (const record of group) {
      room(150);
      text(record.title, 27, true);
      text(dateLabel(record.occurredAt), 21, false, "#666");
      text(summary(record));
      const detail = details(record);
      if (detail) text(detail);
      if (record.note && record.kind !== "reflection")
        text(`備註：${record.note}`);
      if (options.includeImages)
        for (const id of record.images) {
          const image = new Image();
          image.src = `/api/self/images/${encodeURIComponent(id)}`;
          try {
            await image.decode();
          } catch {
            throw new Error("圖片讀取失敗，請重試或取消包含圖片後匯出");
          }
          const scale = Math.min(
            width / image.naturalWidth,
            650 / image.naturalHeight,
            1,
          );
          const w = image.naturalWidth * scale,
            h = image.naturalHeight * scale;
          room(h + 24);
          context.drawImage(image, margin, y, w, h);
          y += h + 24;
        }
      y += 18;
      room(20);
      context.strokeStyle = "#ddd";
      context.beginPath();
      context.moveTo(margin, y);
      context.lineTo(1150, y);
      context.stroke();
      y += 24;
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    y += 20;
  }
  flush();
  canvas.width = 0;
  canvas.height = 0;
  pdf.setProperties({
    title: "回診摘要",
    author: options.name,
    creator: "self",
  });
  return pdf.output("blob");
}

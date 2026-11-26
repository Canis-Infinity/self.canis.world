import { z } from "zod";
import { entry } from "./schema";
import {
  Heart,
  Utensils,
  Moon,
  Activity,
  Pill,
  NotebookPen,
  CalendarDays,
} from "lucide-react";
export type EntryInput = z.infer<typeof entry>;
export type Entry = EntryInput & { id: string; version: number };
export type Kind = EntryInput["kind"];
export const categories = {
  mood: {
    label: "情緒日誌",
    icon: Heart,
    description: "留意此刻的感受與發生的事",
  },
  sleep: {
    label: "睡眠紀錄",
    icon: Moon,
    description: "記下入睡、醒來與休息品質",
  },
  body: {
    label: "身體數據",
    icon: Activity,
    description: "追蹤量測數值與身體變化",
  },
  medication: {
    label: "用藥紀錄",
    icon: Pill,
    description: "記錄早、中、晚、睡前的服藥狀態與反應",
  },
  reflection: {
    label: "自我反思",
    icon: NotebookPen,
    description: "把想法留在這裡，慢慢理解自己",
  },
  diet: {
    label: "飲食紀錄",
    icon: Utensils,
    description: "記錄飲食、飲料與食慾的變化",
  },
  appointment: {
    label: "回診行事曆",
    icon: CalendarDays,
    description: "安排下次回診，準備想討論的事",
  },
} as const;
export const kinds = Object.keys(categories) as Kind[];
export const meals = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  snack: "點心",
};
export function moodScore(data: { score: number; scale?: number }) {
  return data.scale === 10 ? data.score : [1, 3, 6, 8, 10][data.score - 1];
}
export const moods = ["很低落", "有些低落", "平穩", "還不錯", "很好"];
export const qualities = ["很差", "較差", "普通", "不錯", "很好"];
export const medicationPeriods = {
  morning: "早",
  noon: "中",
  evening: "晚",
  bedtime: "睡前",
};
export const appointmentSessions = {
  morning: "上午診",
  afternoon: "下午診",
  evening: "晚診",
};
export const metrics = {
  weight: "體重",
  temperature: "體溫",
  heartRate: "心率",
  systolic: "收縮壓",
  diastolic: "舒張壓",
  other: "其他",
};
export const units = {
  weight: "kg",
  temperature: "°C",
  heartRate: "bpm",
  systolic: "mmHg",
  diastolic: "mmHg",
  other: "",
};
export function dateLabel(value: string | Date, dateOnly = false) {
  return new Date(value).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(dateOnly
      ? {}
      : { hour: "2-digit" as const, minute: "2-digit" as const }),
    hour12: false,
  });
}
export function dayKey(value: Date | string) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function summary(record: EntryInput) {
  switch (record.kind) {
    case "mood":
      return `${moodScore(record.data)} / 10 分${record.data.emotions ? ` · ${record.data.emotions}` : ""}`;
    case "diet":
      return `${meals[record.data.meal]} · 食慾 ${record.data.appetite} / 10 分`;
    case "sleep":
      return `${((new Date(record.data.wakeAt).getTime() - new Date(record.data.bedtime).getTime()) / 3600000).toFixed(1)} 小時 · ${qualities[record.data.quality - 1]}`;
    case "body":
      return `${metrics[record.data.metric]} ${record.data.value} ${record.data.unit}`;
    case "medication":
      return `${medicationPeriods[record.data.period] || "未指定時段"} · ${record.data.status === "taken" ? "已服用" : "未服用"}`;
    case "reflection":
      return record.data.content;
    case "appointment":
      return [
        appointmentSessions[record.data.session] || "未指定診別",
        record.data.number && `看診號碼 ${record.data.number}`,
      ]
        .filter(Boolean)
        .join(" · ");
  }
}
export function details(record: EntryInput) {
  switch (record.kind) {
    case "diet":
      return [
        record.data.food && `飲食：${record.data.food}`,
        record.data.drinks && `飲料：${record.data.drinks}`,
      ]
        .filter(Boolean)
        .join("\n");
    case "mood":
      return record.data.trigger && `相關事件：${record.data.trigger}`;
    case "sleep":
      return `${dateLabel(record.data.bedtime)} 入睡 → ${dateLabel(record.data.wakeAt)} 起床`;
    case "medication":
      return record.data.reaction && `用藥後反應：${record.data.reaction}`;
    case "reflection":
      return "";
    case "appointment":
      return record.data.questions && `想與醫師討論：${record.data.questions}`;
    default:
      return "";
  }
}

// Interpolate through amber; endpoints match the requested red and green.
export function scoreColor(score: number) {
  const stops = [
    [159, 7, 18],
    [148, 105, 0],
    [1, 102, 48],
  ];
  const position = ((Math.max(1, Math.min(10, score)) - 1) / 9) * 2;
  const index = Math.min(1, Math.floor(position));
  return (
    "#" +
    stops[index]
      .map((value, channel) =>
        Math.round(
          value + (stops[index + 1][channel] - value) * (position - index),
        )
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
      .toUpperCase()
  );
}

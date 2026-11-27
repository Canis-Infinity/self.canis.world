import type { CSSProperties } from "react";
import { Badge } from "@/components/ui/badge";
import { type Entry, moodScore, summary, details, meals } from "@/lib/records";

export function RecordContent({ record: r }: { record: Entry }) {
  const fields: [string, string | undefined][] = [];
  let headline = "";
  if (r.kind === "mood") {
    fields.push(["感受", r.data.emotions], ["事件", r.data.trigger]);
  } else if (r.kind === "diet") {
    headline = meals[r.data.meal];
    fields.push(
      [r.data.meal === "drink" ? "飲料" : "餐點", r.data.food],
      ["飲料", r.data.drinks],
    );
  } else if (r.kind === "reflection") {
    fields.push(
      ["題目", r.data.prompt],
      ["想法", r.data.content],
      ["感謝", r.data.gratitude],
    );
  } else {
    headline = summary(r);
    if (r.kind === "sleep") fields.push(["時間", details(r)]);
    if (r.kind === "medication")
      fields.push(
        ["藥物", [r.data.medicine, r.data.dose].filter(Boolean).join(" · ")],
        ["反應", r.data.reaction],
      );
    if (r.kind === "appointment")
      fields.push(
        [
          "院所",
          [r.data.hospital, r.data.department, r.data.doctor]
            .filter(Boolean)
            .join(" · "),
        ],
        ["討論", r.data.questions],
      );
  }
  const score =
    r.kind === "mood"
      ? moodScore(r.data)
      : r.kind === "diet"
        ? r.data.appetite
        : null;
  const yesNo = (value: boolean | undefined) =>
    value == null ? "未填寫" : value ? "有" : "無";
  const badgeTone = (value: number) => {
    if (value <= 2)
      return {
        classes: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
        bg: "#fef2f2",
        ink: "#b91c1c",
      };
    if (value <= 4)
      return {
        classes:
          "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
        bg: "#fff7ed",
        ink: "#c2410c",
      };
    if (value <= 6)
      return {
        classes:
          "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        bg: "#fffbeb",
        ink: "#b45309",
      };
    if (value <= 8)
      return {
        classes: "bg-lime-50 text-lime-700 dark:bg-lime-950 dark:text-lime-300",
        bg: "#f7fee7",
        ink: "#4d7c0f",
      };
    return {
      classes:
        "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
      bg: "#f0fdf4",
      ink: "#15803d",
    };
  };
  const badgeStyle = (tone: ReturnType<typeof badgeTone> | undefined) =>
    tone
      ? ({ "--badge-bg": tone.bg, "--badge-ink": tone.ink } as CSSProperties)
      : undefined;
  const moodBadges =
    r.kind === "mood"
      ? [
          {
            label: "心情指數",
            value: moodScore(r.data),
            color: badgeTone(moodScore(r.data)),
          },
          {
            label: "自傷傾向",
            value: r.data.selfHarmUrge ?? "未填寫",
            color:
              r.data.selfHarmUrge == null
                ? undefined
                : badgeTone(10 - r.data.selfHarmUrge * 0.9),
          },
          {
            label: "自殺傾向",
            value: r.data.suicideUrge ?? "未填寫",
            color:
              r.data.suicideUrge == null
                ? undefined
                : badgeTone(10 - r.data.suicideUrge * 0.9),
          },
          {
            label: "自傷行為",
            value: yesNo(r.data.selfHarmed),
            color: r.data.selfHarmed ? badgeTone(1) : undefined,
          },
          {
            label: "自殺行為",
            value: yesNo(r.data.suicideAttempted),
            color: r.data.suicideAttempted ? badgeTone(1) : undefined,
          },
        ]
      : [];
  return (
    <div className="space-y-4">
      {r.kind === "mood" && (
        <div
          className="record-indicators flex flex-wrap gap-2"
          role="group"
          aria-label="心情與行為指標"
        >
          {moodBadges.map(({ label, value, color }) => (
            <Badge
              key={label}
              variant="outline"
              className={`h-auto gap-2 px-2.5 py-1 text-xs ${color ? `border-transparent ${color.classes}` : ""}`}
              style={badgeStyle(color)}
            >
              <span className="font-normal">{label}</span>
              <span className="font-semibold tabular-nums">{value}</span>
            </Badge>
          ))}
        </div>
      )}
      {r.kind !== "mood" && (score !== null || headline) && (
        <div className="flex flex-wrap items-center gap-2">
          {score !== null && (
            <Badge
              className={`h-auto px-2.5 py-1 ${badgeTone(score).classes}`}
              style={badgeStyle(badgeTone(score))}
            >
              食慾 {score}
            </Badge>
          )}
          {headline && (
            <p className="font-medium whitespace-pre-wrap break-words">
              {headline}
            </p>
          )}
        </div>
      )}
      {fields.some(([, value]) => value) && (
        <dl className="space-y-3">
          {fields
            .filter(([, value]) => value)
            .map(([label, value], i) => (
              <div
                key={i}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 text-sm leading-relaxed"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="whitespace-pre-wrap break-words">{value}</dd>
              </div>
            ))}
        </dl>
      )}
      {r.note && (
        <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-t pt-3 text-sm leading-relaxed">
          <span className="text-muted-foreground">備註</span>
          <p className="whitespace-pre-wrap break-words">{r.note}</p>
        </div>
      )}
    </div>
  );
}

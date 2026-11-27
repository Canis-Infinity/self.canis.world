import { Badge } from "@/components/ui/badge";
import {
  type Entry,
  moodScore,
  scoreColor,
  summary,
  details,
  meals,
} from "@/lib/records";

export function RecordContent({ record: r }: { record: Entry }) {
  const fields: [string, string | undefined][] = [];
  let headline = "";
  if (r.kind === "mood") {
    fields.push(["事件", r.data.trigger]);
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
  return (
    <div className="space-y-3">
      {(score !== null || headline) && (
        <div className="flex flex-wrap items-center gap-2">
          {score !== null && (
            <Badge
              style={{ backgroundColor: scoreColor(score), color: "#fff" }}
              aria-label={`${r.kind === "mood" ? "心情" : "食慾"} ${score} 分`}
            >
              {r.kind === "diet" && "食慾 "}
              {score}
            </Badge>
          )}
          {headline && (
            <p className="font-medium whitespace-pre-wrap break-words">
              {headline}
            </p>
          )}
          {r.kind === "mood" && r.data.emotions && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {r.data.emotions}
            </p>
          )}
        </div>
      )}
      {fields.some(([, value]) => value) && (
        <dl className="space-y-2">
          {fields
            .filter(([, value]) => value)
            .map(([label, value], i) => (
              <div
                key={i}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 text-sm"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="whitespace-pre-wrap break-words">{value}</dd>
              </div>
            ))}
        </dl>
      )}
      {r.kind === "mood" && (
        <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {[
            ["自傷傾向", r.data.selfHarmUrge ?? "未填寫"],
            ["自殺傾向", r.data.suicideUrge ?? "未填寫"],
            ["自傷行為", yesNo(r.data.selfHarmed)],
            ["嘗試自殺", yesNo(r.data.suicideAttempted)],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-1.5">
              <dt>{label}</dt>
              <dd className="font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {r.note && (
        <p className="border-t pt-3 text-sm whitespace-pre-wrap break-words leading-relaxed">
          {r.note}
        </p>
      )}
    </div>
  );
}

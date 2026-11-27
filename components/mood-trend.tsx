"use client";
import { useEffect, useState } from "react";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addHours,
} from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
export type TrendPeriod = "day" | "week" | "month";
type Point = { key: string; score: number; count: number };
export function MoodTrend({
  anchor,
  period,
  onPeriodChange,
  revision,
}: {
  anchor: Date;
  period: TrendPeriod;
  onPeriodChange: (value: TrendPeriod) => void;
  revision: number;
}) {
  const [points, setPoints] = useState<Point[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0);
  const start =
    period === "day"
      ? startOfDay(anchor)
      : period === "week"
        ? startOfWeek(anchor, { weekStartsOn: 0 })
        : startOfMonth(anchor);
  const end =
    period === "day"
      ? endOfDay(anchor)
      : period === "week"
        ? endOfWeek(anchor, { weekStartsOn: 0 })
        : endOfMonth(anchor);
  const from = start.toISOString(),
    to = end.toISOString();
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({
      from,
      to,
      period,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    api<{ points: Point[] }>(`/mood-trend?${params}`, { signal: abort.signal })
      .then((result) => setPoints(result.points))
      .catch(() => {
        if (!abort.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [from, to, period, revision, retry]);
  const dates: Date[] = [];
  for (
    let date = start;
    date <= end;
    date = period === "day" ? addHours(date, 1) : addDays(date, 1)
  )
    dates.push(date);
  const slots = dates.map((date, i) => {
    const key = format(
      date,
      period === "day" ? "yyyy-MM-dd'T'HH" : "yyyy-MM-dd",
    );
    const point = points.find((p) => p.key === key);
    return {
      date,
      point,
      x: 40 + (i * 520) / Math.max(1, dates.length - 1),
      y: point ? 190 - (point.score - 1) * 17 : 0,
    };
  });
  const segments: string[][] = [];
  let segment: string[] = [];
  for (const slot of slots) {
    if (slot.point) segment.push(`${slot.x},${slot.y}`);
    else if (segment.length) {
      segments.push(segment);
      segment = [];
    }
  }
  if (segment.length) segments.push(segment);
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>心情的變化</CardTitle>
          <Tabs
            value={period}
            onValueChange={(value) => onPeriodChange(value as TrendPeriod)}
          >
            <TabsList variant="line" aria-label="心情圖表期間">
              {(
                [
                  ["day", "當日"],
                  ["week", "週"],
                  ["month", "月"],
                ] as const
              ).map(([value, label]) => (
                <TabsTrigger key={value} value={value}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <CardDescription>
          {format(start, "yyyy/MM/dd")}
          {period !== "day" && ` – ${format(end, "yyyy/MM/dd")}`} ·{" "}
          {period === "day" ? "每小時" : "每日"}平均心情
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-56 w-full" />
        ) : error ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3">
            <p>暫時無法讀取心情圖表</p>
            <Button variant="outline" onClick={() => setRetry((n) => n + 1)}>
              重新載入
            </Button>
          </div>
        ) : points.length ? (
          <>
            <svg
              viewBox="0 0 600 230"
              role="img"
              aria-label="心情趨勢圖，分數 1 至 10，空白代表未記錄"
              className="h-56 w-full overflow-visible"
            >
              {[1, 4, 7, 10].map((score) => (
                <g key={score}>
                  <line
                    x1="40"
                    x2="560"
                    y1={190 - (score - 1) * 17}
                    y2={190 - (score - 1) * 17}
                    stroke="currentColor"
                    className="text-border"
                  />
                  <text
                    x="26"
                    y={195 - (score - 1) * 17}
                    textAnchor="end"
                    fill="currentColor"
                    className="text-muted-foreground"
                    fontSize="12"
                  >
                    {score}
                  </text>
                </g>
              ))}
              {segments.map((points, i) => (
                <polyline
                  key={i}
                  points={points.join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary"
                />
              ))}
              {slots.map(({ date, point, x, y }, i) => (
                <g key={i}>
                  {point && (
                    <>
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill="var(--background)"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-primary"
                      >
                        <title>
                          {format(date, period === "day" ? "HH:mm" : "MM/dd")}：
                          {point.score.toFixed(1)} 分（{point.count} 筆）
                        </title>
                      </circle>
                      {(dates.length <= 7 || points.length <= 7) && (
                        <text
                          x={x}
                          y={y - 12}
                          textAnchor="middle"
                          fill="currentColor"
                          fontSize="13"
                        >
                          {Number(point.score.toFixed(1))}
                        </text>
                      )}
                    </>
                  )}
                  {(i === 0 ||
                    i === dates.length - 1 ||
                    i % (period === "day" ? 4 : period === "week" ? 1 : 5) ===
                      0) && (
                    <text
                      x={x}
                      y="220"
                      textAnchor="middle"
                      fill="currentColor"
                      className="text-muted-foreground"
                      fontSize="12"
                    >
                      {format(date, period === "day" ? "HH:mm" : "MM/dd")}
                    </text>
                  )}
                </g>
              ))}
            </svg>
            <table className="sr-only">
              <caption>心情平均分數與紀錄筆數</caption>
              <tbody>
                {points.map((point) => (
                  <tr key={point.key}>
                    <th>{point.key}</th>
                    <td>{point.score.toFixed(1)}</td>
                    <td>{point.count} 筆</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="flex h-56 items-center justify-center text-muted-foreground">
            這段時間還沒有心情紀錄。
          </p>
        )}
      </CardContent>
    </Card>
  );
}

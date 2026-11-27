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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  ComposedChart,
  Line,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
export type TrendPeriod = "day" | "week" | "month";
type Point = {
  key: string;
  score: number | null;
  selfHarm: number | null;
  suicide: number | null;
  appetite: number | null;
  count: number;
};
const config = {
  score: { label: "情緒", color: "#3b82f6" },
  selfHarm: { label: "自傷", color: "#f59e0b" },
  suicide: { label: "自殺", color: "#f43f5e" },
  appetite: { label: "食慾", color: "#14b8a6" },
} satisfies ChartConfig;
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
      .then((result) => {
        if (!abort.signal.aborted)
          setPoints(
            result.points.map((point) => ({
              ...point,
              ...Object.fromEntries(
                (["score", "selfHarm", "suicide", "appetite"] as const).map(
                  (key) => [
                    key,
                    point[key] == null ? null : Number(point[key].toFixed(1)),
                  ],
                ),
              ),
            })),
          );
      })
      .catch(() => {
        if (!abort.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [from, to, period, revision, retry]);
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>狀態的變化</CardTitle>
          <Tabs
            value={period}
            onValueChange={(value) => onPeriodChange(value as TrendPeriod)}
          >
            <TabsList variant="line" aria-label="狀態圖表期間">
              {(
                [
                  ["day", "日"],
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
          {period === "day" ? "每小時" : "每日"}平均分數 · 自傷、自殺為傾向分數
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <p>暫時無法讀取狀態圖表</p>
            <Button variant="outline" onClick={() => setRetry((n) => n + 1)}>
              重新載入
            </Button>
          </div>
        ) : points.length ? (
          <>
            <ChartContainer
              config={config}
              className="h-64 w-full"
              aria-label="情緒、自傷、自殺、食慾趨勢圖"
            >
              <ComposedChart
                accessibilityLayer
                data={points}
                margin={{ top: 12, right: 12, left: -20 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="key"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                  tickFormatter={(key: string) =>
                    period === "day"
                      ? `${key.slice(11)}:00`
                      : key.slice(5).replace("-", "/")
                  }
                />
                <YAxis
                  domain={[0, 10]}
                  ticks={[0, 2, 4, 6, 8, 10]}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(key) =>
                        String(key).replace("T", " ") +
                        (period === "day" ? ":00" : "")
                      }
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="appetite"
                  fill="var(--color-appetite)"
                  fillOpacity={0.45}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                  isAnimationActive={false}
                />
                {(["score", "selfHarm", "suicide"] as const).map((key) => (
                  <Line
                    key={key}
                    dataKey={key}
                    type="linear"
                    stroke={`var(--color-${key})`}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}
              </ComposedChart>
            </ChartContainer>
            <p className="mt-2 text-xs text-muted-foreground">
              未記錄的項目不視為 0；折線連接已記錄的平均分數。
            </p>
            <table className="sr-only">
              <caption>情緒、自傷、自殺、食慾平均分數與紀錄筆數</caption>
              <tbody>
                {points.map((point) => (
                  <tr key={point.key}>
                    <th>{point.key}</th>
                    {(
                      ["score", "selfHarm", "suicide", "appetite"] as const
                    ).map((key) => (
                      <td key={key}>
                        {config[key].label}：
                        {point[key]?.toFixed(1) ?? "未記錄"}
                      </td>
                    ))}
                    <td>{point.count} 筆</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="flex h-64 items-center justify-center text-muted-foreground">
            這段時間還沒有情緒或飲食紀錄。
          </p>
        )}
      </CardContent>
    </Card>
  );
}

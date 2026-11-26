"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dayKey, appointmentSessions, type Entry } from "@/lib/records";
import { cn } from "@/lib/utils";
export function AppointmentCalendar({
  appointments,
  onCreate,
  onEdit,
}: {
  appointments: Entry[];
  onCreate: (date: Date) => void;
  onEdit: (record: Entry) => void;
}) {
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const today = dayKey(new Date());
  const start = new Date(month);
  start.setDate(1 - start.getDay());
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const rows = Math.ceil((month.getDay() + daysInMonth) / 7);
  function create(date: Date) {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    onCreate(next);
  }
  return (
    <section
      className="overflow-hidden rounded-xl border bg-card"
      aria-label="回診月曆"
    >
      <h1 className="sr-only">回診行事曆</h1>
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            onClick={() =>
              setMonth(
                new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              )
            }
          >
            今天
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="上一個月"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
          >
            <ChevronLeft />
          </Button>
          <h2 aria-live="polite" className="text-lg font-semibold sm:text-2xl">
            {month.toLocaleDateString("zh-TW", {
              year: "numeric",
              month: "long",
            })}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="下一個月"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
          >
            <ChevronRight />
          </Button>
        </div>
        <Button onClick={() => create(new Date())}>
          <Plus />
          新增記錄
        </Button>
      </div>
      <Table className="min-w-[700px] table-fixed">
        <TableHeader>
          <TableRow>
            {[
              "星期日",
              "星期一",
              "星期二",
              "星期三",
              "星期四",
              "星期五",
              "星期六",
            ].map((day) => (
              <TableHead
                key={day}
                className="h-12 text-center font-normal text-muted-foreground"
              >
                {day}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, row) => (
            <TableRow key={row} className="hover:bg-transparent">
              {Array.from({ length: 7 }, (_, column) => {
                const date = new Date(start);
                date.setDate(start.getDate() + row * 7 + column);
                const key = dayKey(date);
                const entries = appointments.filter(
                  (r) => dayKey(r.occurredAt) === key,
                );
                return (
                  <TableCell
                    key={key}
                    className={cn(
                      "h-36 border-r p-2 align-top whitespace-normal last:border-r-0 sm:h-44 xl:h-48",
                      date.getMonth() !== month.getMonth() &&
                        "bg-muted/25 text-muted-foreground",
                    )}
                  >
                    <Button
                      variant={key === today ? "default" : "ghost"}
                      size="icon"
                      className="mb-2 rounded-full"
                      aria-label={`${date.toLocaleDateString("zh-TW")} 新增記錄`}
                      aria-current={key === today ? "date" : undefined}
                      onClick={() => create(date)}
                    >
                      {date.getDate()}
                    </Button>
                    <div className="space-y-1">
                      {entries.map((r) => (
                        <Button
                          key={r.id}
                          variant="secondary"
                          className="h-auto w-full items-start justify-start overflow-hidden px-2 py-1.5 text-left"
                          onClick={() => onEdit(r)}
                          title={r.title}
                        >
                          <span className="min-w-0 space-y-0.5">
                            <span className="block truncate font-medium">
                              {r.title}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {r.kind === "appointment" &&
                                [
                                  appointmentSessions[r.data.session],
                                  r.data.number && `${r.data.number} 號`,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                            </span>
                          </span>
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

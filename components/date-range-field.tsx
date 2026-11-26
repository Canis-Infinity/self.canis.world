"use client";
import { useId, useState } from "react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

export function DateRangeField({
  from,
  to,
  onChange,
}: {
  from: Date;
  to: Date;
  onChange: (from: Date, to: Date) => void;
}) {
  const id = useId();
  const mobile = useIsMobile();
  const [draft, setDraft] = useState<DateRange | undefined>({ from, to });
  return (
    <Field className="min-w-0">
      <FieldLabel htmlFor={id}>日期區間</FieldLabel>
      <Popover
        onOpenChange={(open) => {
          if (open) setDraft({ from, to });
        }}
      >
        <PopoverTrigger
          render={
            <Button
              id={id}
              variant="outline"
              className="min-w-0 justify-start px-2.5 font-normal"
            />
          }
        >
          <CalendarIcon data-icon="inline-start" />
          {format(from, "yyyy/MM/dd")} – {format(to, "yyyy/MM/dd")}
        </PopoverTrigger>
        <PopoverContent
          className="w-auto max-w-[calc(100vw-2rem)] overflow-auto p-0"
          align="start"
        >
          <Calendar
            mode="range"
            locale={zhTW}
            weekStartsOn={0}
            defaultMonth={draft?.from}
            selected={draft}
            numberOfMonths={mobile ? 1 : 2}
            onSelect={(range) => {
              setDraft(range);
              if (range?.from && range.to) {
                const start = new Date(range.from);
                start.setHours(0, 0, 0, 0);
                const end = new Date(range.to);
                end.setHours(23, 59, 59, 999);
                onChange(start, end);
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}

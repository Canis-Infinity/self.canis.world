"use client";
import { useId, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { zhTW } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
export function DateTimeField({
  label,
  value,
  onChange,
  dateOnly = false,
}: {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
  dateOnly?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <FieldGroup className="w-auto flex-row flex-wrap gap-3">
      <Field className="w-fit">
        <FieldLabel htmlFor={id}>
          {dateOnly
            ? label
            : label.includes("日期")
              ? label.replace("與時間", "")
              : `${label}日期`}
        </FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={<Button id={id} type="button" variant="outline" />}
          >
            <CalendarIcon />
            {value.toLocaleDateString("zh-TW")}
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              locale={zhTW}
              weekStartsOn={0}
              selected={value}
              defaultMonth={value}
              onSelect={(d) => {
                if (d) {
                  const next = new Date(d);
                  next.setHours(
                    value.getHours(),
                    value.getMinutes(),
                    value.getSeconds(),
                    0,
                  );
                  onChange(next);
                  setOpen(false);
                }
              }}
              captionLayout="dropdown"
              startMonth={new Date(2000, 0)}
              endMonth={new Date(2100, 11)}
            />
          </PopoverContent>
        </Popover>
      </Field>
      {!dateOnly && (
        <Field className="w-40">
          <FieldLabel htmlFor={`${id}-time`}>
            {label.includes("日期") ? "時間" : `${label}時間`}
          </FieldLabel>
          <Input
            id={`${id}-time`}
            type="time"
            aria-label={`${label}時間`}
            required
            step="1"
            className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
            value={`${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}:${String(value.getSeconds()).padStart(2, "0")}`}
            onChange={(e) => {
              const [h, m, seconds = 0] = e.target.value.split(":").map(Number);
              if (
                e.target.value &&
                Number.isFinite(h) &&
                Number.isFinite(m) &&
                Number.isFinite(seconds)
              ) {
                const d = new Date(value);
                d.setHours(h, m, seconds, 0);
                onChange(d);
              }
            }}
          />
        </Field>
      )}
    </FieldGroup>
  );
}

"use client";
import { useId, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { zhTW } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-wrap gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={<Button id={id} type="button" variant="outline" />}
          >
            <CalendarIcon />
            {value.toLocaleDateString("zh-TW")}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              locale={zhTW}
              weekStartsOn={0}
              selected={value}
              onSelect={(d) => {
                if (d) {
                  const next = new Date(d);
                  next.setHours(value.getHours(), value.getMinutes(), 0, 0);
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
        {!dateOnly && (
          <Input
            type="time"
            aria-label={`${label}時間`}
            required
            step="60"
            className="w-32"
            value={`${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`}
            onChange={(e) => {
              const [h, m] = e.target.value.split(":").map(Number);
              if (Number.isFinite(h) && Number.isFinite(m)) {
                const d = new Date(value);
                d.setHours(h, m, 0, 0);
                onChange(d);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

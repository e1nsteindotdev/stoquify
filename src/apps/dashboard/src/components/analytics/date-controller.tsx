import { useState, useMemo } from "react";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DatePreset =
  | "today"
  | "thisWeek"
  | "thisMonth"
  | "lastWeek"
  | "lastMonth"
  | "lastYear"
  | "thisYear"
  | "custom"
  | "allTime";

export interface DateRange {
  from: string;
  to: string;
}

interface DateControllerProps {
  defaultPreset?: DatePreset;
  className?: string;
  onChange?: (range: DateRange, preset: DatePreset) => void;
}

const presetLabels: Record<DatePreset, string> = {
  today: "Today",
  thisWeek: "This Week",
  thisMonth: "This Month",
  lastWeek: "Last Week",
  lastMonth: "Last Month",
  lastYear: "Last Year",
  thisYear: "This Year",
  custom: "Custom",
  allTime: "All Time",
};

function getPresetDates(preset: DatePreset): DateRange {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getEndOfWeek = (date: Date) => {
    const start = getStartOfWeek(date);
    return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  };

  const getStartOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1);

  const getEndOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const getStartOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);

  const getEndOfYear = (date: Date) => new Date(date.getFullYear(), 11, 31);

  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "thisWeek": {
      const start = getStartOfWeek(now);
      const end = getEndOfWeek(now);
      return {
        from: start.toISOString().split("T")[0],
        to: end.toISOString().split("T")[0],
      };
    }
    case "thisMonth": {
      const start = getStartOfMonth(now);
      const end = getEndOfMonth(now);
      return {
        from: start.toISOString().split("T")[0],
        to: end.toISOString().split("T")[0],
      };
    }
    case "lastWeek": {
      const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastWeekEnd = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      const start = getStartOfWeek(lastWeekStart);
      const end = getEndOfWeek(lastWeekStart);
      return {
        from: start.toISOString().split("T")[0],
        to: end.toISOString().split("T")[0],
      };
    }
    case "lastMonth": {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const start = getStartOfMonth(lastMonth);
      const end = getEndOfMonth(lastMonth);
      return {
        from: start.toISOString().split("T")[0],
        to: end.toISOString().split("T")[0],
      };
    }
    case "lastYear": {
      const lastYear = now.getFullYear() - 1;
      return {
        from: `${lastYear}-01-01`,
        to: `${lastYear}-12-31`,
      };
    }
    case "thisYear": {
      const start = getStartOfYear(now);
      const end = getEndOfYear(now);
      return {
        from: start.toISOString().split("T")[0],
        to: end.toISOString().split("T")[0],
      };
    }
    case "allTime":
      return { from: "1970-01-01", to: today };
    default:
      return { from: today, to: today };
  }
}

export function DateController({
  defaultPreset = "thisMonth",
  className,
  onChange,
}: DateControllerProps) {
  const [preset, setPreset] = useState<DatePreset>(defaultPreset);
  const [customRange, setCustomRange] = useState<DateRange>(() =>
    getPresetDates(defaultPreset),
  );

  const currentRange = useMemo(() => {
    if (preset === "custom") {
      return customRange;
    }
    return getPresetDates(preset);
  }, [preset, customRange]);

  const handlePresetChange = (newPreset: DatePreset) => {
    setPreset(newPreset);
    const range = getPresetDates(newPreset);
    if (newPreset !== "custom") {
      setCustomRange(range);
    }
    onChange?.(range, newPreset);
  };

  const handleCustomDateChange = (field: "from" | "to", value: string) => {
    const newRange = { ...customRange, [field]: value };
    setCustomRange(newRange);
    onChange?.(newRange, "custom");
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <CalendarIcon className="size-4" />
            <span>{preset === "custom" ? "Custom" : presetLabels[preset]}</span>
            <ChevronDownIcon className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handlePresetChange("today")}>
            Today
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetChange("thisWeek")}>
            This Week
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetChange("thisMonth")}>
            This Month
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetChange("lastWeek")}>
            Last Week
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetChange("lastMonth")}>
            Last Month
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetChange("thisYear")}>
            This Year
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetChange("lastYear")}>
            Last Year
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetChange("custom")}>
            Custom
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetChange("allTime")}>
            All Time
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {preset === "custom" && (
        <div className="flex items-center gap-1">
          <input
            type="date"
            className="h-8 rounded-md border bg-background px-2 text-sm"
            value={customRange.from}
            onChange={(e) => handleCustomDateChange("from", e.target.value)}
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="date"
            className="h-8 rounded-md border bg-background px-2 text-sm"
            value={customRange.to}
            onChange={(e) => handleCustomDateChange("to", e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

export { getPresetDates };

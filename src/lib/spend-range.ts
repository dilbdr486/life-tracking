import {
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { toDateInputValue } from "@/lib/utils";

export type SpendView = "weekly" | "monthly" | "custom";

export type SpendRangeSelection = {
  view: SpendView;
  start: Date;
  end: Date;
  label: string;
  dateValue: string;
  monthValue: string;
  fromValue: string;
  toValue: string;
};

function parseDateParam(value?: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = parseISO(raw);
  return isValid(parsed) ? parsed : null;
}

function parseMonthParam(value?: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d{4}-\d{2}$/.test(raw)) return null;
  const parsed = parseISO(`${raw}-01`);
  return isValid(parsed) ? parsed : null;
}

export function resolveSpendRange(params: {
  view?: string | string[];
  date?: string | string[];
  month?: string | string[];
  from?: string | string[];
  to?: string | string[];
}): SpendRangeSelection {
  const now = new Date();
  const viewRaw = Array.isArray(params.view) ? params.view[0] : params.view;
  const view: SpendView =
    viewRaw === "monthly" || viewRaw === "custom" || viewRaw === "weekly"
      ? viewRaw
      : "weekly";

  if (view === "monthly") {
    const anchor = parseMonthParam(params.month) ?? startOfMonth(now);
    const start = startOfMonth(anchor);
    const end = endOfMonth(anchor);
    return {
      view,
      start,
      end,
      label: format(start, "MMMM yyyy"),
      dateValue: toDateInputValue(now),
      monthValue: format(start, "yyyy-MM"),
      fromValue: toDateInputValue(start),
      toValue: toDateInputValue(end),
    };
  }

  if (view === "custom") {
    const from = parseDateParam(params.from) ?? startOfWeek(now, { weekStartsOn: 1 });
    let to = parseDateParam(params.to) ?? endOfWeek(now, { weekStartsOn: 1 });
    if (to < from) to = from;
    return {
      view,
      start: from,
      end: to,
      label: `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`,
      dateValue: toDateInputValue(now),
      monthValue: format(now, "yyyy-MM"),
      fromValue: toDateInputValue(from),
      toValue: toDateInputValue(to),
    };
  }

  const anchor = parseDateParam(params.date) ?? now;
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  const end = endOfWeek(anchor, { weekStartsOn: 1 });
  return {
    view: "weekly",
    start,
    end,
    label: `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`,
    dateValue: toDateInputValue(anchor),
    monthValue: format(now, "yyyy-MM"),
    fromValue: toDateInputValue(start),
    toValue: toDateInputValue(end),
  };
}

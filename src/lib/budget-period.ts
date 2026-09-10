import { format } from "date-fns";

export type BudgetPeriod = { year: number; month: number };

export function currentBudgetPeriod(date = new Date()): BudgetPeriod {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function parseBudgetPeriod(
  yearParam?: string | string[],
  monthParam?: string | string[],
): BudgetPeriod {
  const fallback = currentBudgetPeriod();
  const yearRaw = Array.isArray(yearParam) ? yearParam[0] : yearParam;
  const monthRaw = Array.isArray(monthParam) ? monthParam[0] : monthParam;
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    year < 2000 ||
    year > 2100
  ) {
    return fallback;
  }

  return { year, month };
}

export function periodToInputValue({ year, month }: BudgetPeriod) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parsePeriodInput(value: string): BudgetPeriod | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function formatBudgetPeriod({ year, month }: BudgetPeriod) {
  return format(new Date(year, month - 1, 1), "MMMM yyyy");
}

export function periodDateRange({ year, month }: BudgetPeriod) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

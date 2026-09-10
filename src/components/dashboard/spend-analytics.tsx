"use client";

import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { EXPENSE_COLORS } from "@/lib/constants";
import type { SpendView } from "@/lib/spend-range";
import { formatCurrency } from "@/lib/utils";

type Slice = { name: string; value: number };

type ExpenseRow = {
  id: string;
  amount: number;
  category: string;
  paymentMethod: string;
  note: string | null;
  date: string;
};

export function SpendAnalytics({
  view,
  label,
  dateValue,
  monthValue,
  fromValue,
  toValue,
  totalSpend,
  expenseCount,
  byCategory,
  dailySpend,
  expenses,
}: {
  view: SpendView;
  label: string;
  dateValue: string;
  monthValue: string;
  fromValue: string;
  toValue: string;
  totalSpend: number;
  expenseCount: number;
  byCategory: Slice[];
  dailySpend: Slice[];
  expenses: ExpenseRow[];
}) {
  const router = useRouter();
  const { page, setPage, pageCount, pageItems, pageSize, total } =
    usePagination(expenses, 5, `${view}-${label}`);

  function pushParams(next: Record<string, string>) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  function setView(nextView: SpendView) {
    if (nextView === "weekly") {
      pushParams({ view: "weekly", date: dateValue });
      return;
    }
    if (nextView === "monthly") {
      pushParams({ view: "monthly", month: monthValue });
      return;
    }
    pushParams({ view: "custom", from: fromValue, to: toValue });
  }

  return (
    <Card className="animate-rise">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Spend analytics
          </h2>
          <p className="mt-1 text-sm text-(--muted)">
            Weekly, monthly, or custom date spend details · {label}
          </p>
        </div>

        <div className="flex rounded-xl border border-(--border) p-1">
          {(["weekly", "monthly", "custom"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
                view === item ? "bg-(--accent) text-white" : "text-(--muted)"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {view === "weekly" ? (
          <Input
            type="date"
            label="Week of"
            value={dateValue}
            onChange={(event) =>
              pushParams({ view: "weekly", date: event.target.value })
            }
          />
        ) : null}
        {view === "monthly" ? (
          <Input
            type="month"
            label="Month"
            value={monthValue}
            onChange={(event) =>
              pushParams({ view: "monthly", month: event.target.value })
            }
          />
        ) : null}
        {view === "custom" ? (
          <>
            <Input
              type="date"
              label="From"
              value={fromValue}
              onChange={(event) =>
                pushParams({
                  view: "custom",
                  from: event.target.value,
                  to: toValue,
                })
              }
            />
            <Input
              type="date"
              label="To"
              value={toValue}
              onChange={(event) =>
                pushParams({
                  view: "custom",
                  from: fromValue,
                  to: event.target.value,
                })
              }
            />
          </>
        ) : null}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-(--border) px-4 py-3">
          <p className="text-sm text-(--muted)">Total spend</p>
          <p className="mt-1 font-display text-2xl font-semibold">
            {formatCurrency(totalSpend)}
          </p>
        </div>
        <div className="rounded-xl border border-(--border) px-4 py-3">
          <p className="text-sm text-(--muted)">Transactions</p>
          <p className="mt-1 font-display text-2xl font-semibold">
            {expenseCount}
          </p>
        </div>
      </div>

      {expenseCount === 0 ? (
        <p className="rounded-xl border border-dashed border-(--border) px-4 py-10 text-center text-sm text-(--muted)">
          No spending in this period.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <div>
              <CardHeader
                title="By category"
                description="Where money went in this period"
              />
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {byCategory.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={EXPENSE_COLORS[entry.name] ?? "#64748b"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value ?? 0))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-2">
                {byCategory.map((item) => {
                  const pct =
                    totalSpend > 0
                      ? Math.min(100, (item.value / totalSpend) * 100)
                      : 0;
                  return (
                    <div key={item.name}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span>{item.name}</span>
                        <span className="text-(--muted)">
                          {formatCurrency(item.value)} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-(--surface-2)">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              EXPENSE_COLORS[item.name] ?? "#64748b",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <CardHeader
                title="Daily spend"
                description="Day-by-day totals for the selected range"
              />
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailySpend}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value ?? 0))}
                    />
                    <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div>
            <CardHeader
              title="Spend details"
              description="All expenses in the selected period"
            />
            <ul className="space-y-2">
              {pageItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-(--border) px-3 py-3"
                >
                  <div>
                    <p className="font-medium">{item.category}</p>
                    <p className="text-sm text-(--muted)">
                      {item.paymentMethod}
                      {item.note ? ` · ${item.note}` : ""} ·{" "}
                      {format(parseISO(item.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatCurrency(item.amount)}
                  </span>
                </li>
              ))}
            </ul>
            <Pagination
              page={page}
              pageCount={pageCount}
              total={total}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

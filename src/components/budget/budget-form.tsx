"use client";

import { useActionState } from "react";
import { saveBudget, type ActionState } from "@/actions/budget";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export function BudgetForm({
  monthlyIncome,
  monthlyBudget,
  savingsGoal,
  categoryBudgets,
  monthSpend,
  spentByCategory,
}: {
  monthlyIncome: number;
  monthlyBudget: number;
  savingsGoal: number;
  categoryBudgets: Record<string, number>;
  monthSpend: number;
  spentByCategory: Record<string, number>;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveBudget,
    {},
  );
  const remaining = monthlyBudget - monthSpend;
  const estimatedSavings = Math.max(0, monthlyIncome - monthSpend);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader
          title="Budget settings"
          description="Set income, monthly limit, and category caps"
        />
        <form action={action} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              name="monthlyIncome"
              type="number"
              step="0.01"
              min="0"
              label="Monthly income"
              placeholder="0"
              defaultValue={monthlyIncome || ""}
            />
            <Input
              name="monthlyBudget"
              type="number"
              step="0.01"
              min="0"
              label="Monthly budget"
              placeholder="0"
              defaultValue={monthlyBudget || ""}
            />
            <Input
              name="savingsGoal"
              type="number"
              step="0.01"
              min="0"
              label="Savings goal"
              placeholder="0"
              defaultValue={savingsGoal || ""}
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-(--muted)">
              Budget per category
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {EXPENSE_CATEGORIES.map((category) => (
                <Input
                  key={category}
                  name={`cat_${category}`}
                  type="number"
                  step="0.01"
                  min="0"
                  label={category}
                  placeholder="0"
                  defaultValue={categoryBudgets[category] || ""}
                />
              ))}
            </div>
          </div>

          <FormMessage error={state.error} success={state.success} />
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save budget"}
          </Button>
        </form>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader title="This month" description="Live budget health" />
          <dl className="space-y-3 text-sm">
            <Row label="Spent" value={formatCurrency(monthSpend)} />
            <Row label="Remaining" value={formatCurrency(remaining)} />
            <Row
              label="Est. savings"
              value={formatCurrency(estimatedSavings)}
            />
            <Row label="Savings goal" value={formatCurrency(savingsGoal)} />
          </dl>
        </Card>

        <Card>
          <CardHeader
            title="Category progress"
            description="Spent vs category budget"
          />
          <div className="space-y-3">
            {EXPENSE_CATEGORIES.map((category) => {
              const limit = categoryBudgets[category] ?? 0;
              const spent = spentByCategory[category] ?? 0;
              const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
              return (
                <div key={category}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{category}</span>
                    <span className="text-(--muted)">
                      {formatCurrency(spent)} / {formatCurrency(limit)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-(--surface-2)">
                    <div
                      className="h-full rounded-full bg-(--accent)"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-(--border) px-3 py-2.5">
      <dt className="text-(--muted)">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

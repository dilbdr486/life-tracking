"use client";

import { ChevronDown, ChevronUp, Pencil, Plus, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { saveBudget, type ActionState } from "@/actions/budget";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { useActionToast } from "@/hooks/use-action-toast";
import { usePagination } from "@/hooks/use-pagination";
import {
  currentBudgetPeriod,
  formatBudgetPeriod,
  periodToInputValue,
} from "@/lib/budget-period";
import { EXPENSE_CATEGORIES, EXPENSE_COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export type BudgetListItem = {
  id: string;
  year: number;
  month: number;
  monthlyIncome: number;
  monthlyBudget: number;
  savingsGoal: number;
  categoryBudgets: Record<string, number>;
  monthSpend: number;
  spentByCategory: Record<string, number>;
};

type View =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; budget: BudgetListItem };

export function BudgetManager({ budgets }: { budgets: BudgetListItem[] }) {
  const [view, setView] = useState<View>({ mode: "list" });
  const { page, setPage, pageCount, pageItems, pageSize, total } =
    usePagination(budgets, 5, budgets.length);

  if (view.mode === "create" || view.mode === "edit") {
    const editing = view.mode === "edit" ? view.budget : null;
    const period = editing
      ? { year: editing.year, month: editing.month }
      : currentBudgetPeriod();

    return (
      <BudgetEditor
        key={editing?.id ?? "create"}
        mode={view.mode}
        period={period}
        monthlyIncome={editing?.monthlyIncome ?? 0}
        monthlyBudget={editing?.monthlyBudget ?? 0}
        savingsGoal={editing?.savingsGoal ?? 0}
        categoryBudgets={editing?.categoryBudgets ?? {}}
        monthSpend={editing?.monthSpend ?? 0}
        spentByCategory={editing?.spentByCategory ?? {}}
        existingPeriods={budgets.map((b) => `${b.year}-${b.month}`)}
        onCancel={() => setView({ mode: "list" })}
        onSaved={() => setView({ mode: "list" })}
      />
    );
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Monthly budgets
          </h2>
          <p className="mt-1 text-sm text-(--muted)">
            Create a budget per month, then update it anytime
          </p>
        </div>
        <Button type="button" onClick={() => setView({ mode: "create" })}>
          <Plus className="h-4 w-4" />
          Create budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-(--border) px-4 py-10 text-center">
          <p className="text-sm text-(--muted)">No budgets yet.</p>
          <Button
            type="button"
            className="mt-4"
            onClick={() => setView({ mode: "create" })}
          >
            <Plus className="h-4 w-4" />
            Create your first budget
          </Button>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {pageItems.map((budget) => (
              <BudgetListRow
                key={budget.id}
                budget={budget}
                onEdit={() => setView({ mode: "edit", budget })}
              />
            ))}
          </ul>
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </>
      )}
    </Card>
  );
}

function BudgetListRow({
  budget,
  onEdit,
}: {
  budget: BudgetListItem;
  onEdit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const remaining = budget.monthlyBudget - budget.monthSpend;
  const pct =
    budget.monthlyBudget > 0
      ? Math.min(100, (budget.monthSpend / budget.monthlyBudget) * 100)
      : 0;

  return (
    <li className="rounded-xl border border-(--border) px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{formatBudgetPeriod(budget)}</h3>
          <p className="mt-1 text-sm text-(--muted)">
            Income {formatCurrency(budget.monthlyIncome)} · Limit{" "}
            {formatCurrency(budget.monthlyBudget)} · Savings goal{" "}
            {formatCurrency(budget.savingsGoal)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {expanded ? "Collapse" : "Expand"}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Stat label="Spent" value={formatCurrency(budget.monthSpend)} />
        <Stat label="Remaining" value={formatCurrency(remaining)} />
        <Stat label="Used" value={`${pct.toFixed(0)}%`} />
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-(--surface-2)">
        <div
          className="h-full rounded-full bg-(--accent)"
          style={{ width: `${pct}%` }}
        />
      </div>

      {expanded ? (
        <div className="mt-4 border-t border-(--border) pt-4">
          <h4 className="mb-3 text-sm font-medium text-(--muted)">
            Money used by category
          </h4>
          <div className="space-y-3">
            {EXPENSE_CATEGORIES.map((category) => {
              const limit = budget.categoryBudgets[category] ?? 0;
              const spent = budget.spentByCategory[category] ?? 0;
              const categoryPct =
                limit > 0
                  ? Math.min(100, (spent / limit) * 100)
                  : spent > 0
                    ? 100
                    : 0;
              return (
                <div key={category}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{category}</span>
                    <span className="text-(--muted)">
                      Used {formatCurrency(spent)}
                      {limit > 0 ? ` / ${formatCurrency(limit)}` : ""}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-(--surface-2)">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${categoryPct}%`,
                        backgroundColor: EXPENSE_COLORS[category] ?? "#64748b",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </li>
  );
}

function BudgetEditor({
  mode,
  period,
  monthlyIncome,
  monthlyBudget,
  savingsGoal,
  categoryBudgets,
  monthSpend,
  spentByCategory,
  existingPeriods,
  onCancel,
  onSaved,
}: {
  mode: "create" | "edit";
  period: { year: number; month: number };
  monthlyIncome: number;
  monthlyBudget: number;
  savingsGoal: number;
  categoryBudgets: Record<string, number>;
  monthSpend: number;
  spentByCategory: Record<string, number>;
  existingPeriods: string[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveBudget,
    {},
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const skipConfirm = useRef(false);
  const wasPending = useRef(false);
  const remaining = monthlyBudget - monthSpend;
  const estimatedSavings = Math.max(0, monthlyIncome - monthSpend);
  const periodLabel = formatBudgetPeriod(period);
  const isEdit = mode === "edit";

  useActionToast(state, pending);

  useEffect(() => {
    if (wasPending.current && !pending && state.success) {
      onSaved();
    }
    wasPending.current = pending;
  }, [pending, state.success, onSaved]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (skipConfirm.current) return;
    event.preventDefault();
    setConfirmOpen(true);
  }

  function handleConfirm() {
    skipConfirm.current = true;
    setConfirmOpen(false);
    formRef.current?.requestSubmit();
    skipConfirm.current = false;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Card>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {isEdit ? "Update budget" : "Create budget"}
            </h2>
            <p className="mt-1 text-sm text-(--muted)">
              {isEdit
                ? `Edit budget for ${periodLabel}`
                : "Choose a month and set income, limit, and category caps"}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
            Back to list
          </Button>
        </div>

        <form
          ref={formRef}
          action={action}
          className="space-y-4"
          onSubmit={handleSubmit}
        >
          {" "}
          <input type="hidden" name="mode" value={mode} />
          {isEdit ? (
            <>
              <input type="hidden" name="year" value={period.year} />
              <input type="hidden" name="month" value={period.month} />
              <input
                type="hidden"
                name="period"
                value={periodToInputValue(period)}
              />
              <div className="rounded-xl border border-(--border) px-3 py-2.5 text-sm">
                <span className="text-(--muted)">Budget month</span>
                <p className="mt-0.5 font-medium">{periodLabel}</p>
              </div>
            </>
          ) : (
            <Input
              name="period"
              type="month"
              label="Budget month"
              required
              defaultValue={periodToInputValue(period)}
            />
          )}
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
          {!isEdit && existingPeriods.length > 0 ? (
            <p className="text-xs text-(--muted)">
              Already created:{" "}
              {existingPeriods
                .map((key) => {
                  const [y, m] = key.split("-").map(Number);
                  return formatBudgetPeriod({ year: y, month: m });
                })
                .join(", ")}
            </p>
          ) : null}
          <FormMessage error={state.error} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                  ? "Update budget"
                  : "Create budget"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      {isEdit ? (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title={periodLabel}
              description="Spend vs this month's budget"
            />
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
                const progress =
                  limit > 0
                    ? Math.min(100, (spent / limit) * 100)
                    : spent > 0
                      ? 100
                      : 0;
                return (
                  <div key={category}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{category}</span>
                      <span className="text-(--muted)">
                        Used {formatCurrency(spent)}
                        {limit > 0 ? ` / ${formatCurrency(limit)}` : ""}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-(--surface-2)">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${progress}%`,
                          backgroundColor:
                            EXPENSE_COLORS[category] ?? "#64748b",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title={isEdit ? "Update budget?" : "Create budget?"}
        description={
          isEdit
            ? `Save changes to the ${periodLabel} budget?`
            : `Create a new budget for the selected month?`
        }
        confirmLabel={isEdit ? "Update budget" : "Create budget"}
        pending={pending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-(--surface-2) px-3 py-2">
      <p className="text-xs text-(--muted)">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
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

"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import {
  createExpense,
  deleteExpense,
  updateExpense,
} from "@/actions/expenses";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useActionToast } from "@/hooks/use-action-toast";
import { usePagination } from "@/hooks/use-pagination";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import { formatCurrency, toDateInputValue } from "@/lib/utils";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";

type BudgetOption = {
  id: string;
  year: number;
  month: number;
  label: string;
  monthlyBudget: number;
};

type Expense = {
  id: string;
  budgetId: string | null;
  amount: number;
  category: string;
  paymentMethod: string;
  note: string | null;
  date: string | Date;
};

type ConfirmState =
  | { type: "create" }
  | { type: "update" }
  | { type: "delete"; expense: Expense }
  | null;

function defaultDateForBudget(budget: BudgetOption | undefined) {
  if (!budget) return toDateInputValue(new Date());
  const now = new Date();
  if (now.getFullYear() === budget.year && now.getMonth() + 1 === budget.month) {
    return toDateInputValue(now);
  }
  return toDateInputValue(new Date(budget.year, budget.month - 1, 1));
}

export function ExpenseManager({
  expenses,
  budgets,
}: {
  expenses: Expense[];
  budgets: BudgetOption[];
}) {
  const toast = useToast();
  const [editing, setEditing] = useState<Expense | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [historyBudgetId, setHistoryBudgetId] = useState(
    budgets[0]?.id ?? "",
  );
  const [formBudgetId, setFormBudgetId] = useState(budgets[0]?.id ?? "");
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const skipConfirm = useRef(false);
  const wasUpdatePending = useRef(false);
  const [createState, createAction, createPending] = useActionState(
    createExpense,
    {},
  );
  const updateBound = updateExpense.bind(null, editing?.id ?? "");
  const [updateState, updateAction, updatePending] = useActionState(
    updateBound,
    {},
  );
  const [deletePending, startDeleteTransition] = useTransition();

  useActionToast(createState, createPending);
  useActionToast(updateState, updatePending);

  useEffect(() => {
    if (wasUpdatePending.current && !updatePending && updateState.success) {
      setEditing(null);
    }
    wasUpdatePending.current = updatePending;
  }, [updatePending, updateState.success]);

  useEffect(() => {
    if (editing?.budgetId) {
      setFormBudgetId(editing.budgetId);
      return;
    }
    if (!formBudgetId && budgets[0]) {
      setFormBudgetId(budgets[0].id);
    }
  }, [editing, budgets, formBudgetId]);

  const selectedFormBudget = budgets.find((item) => item.id === formBudgetId);
  const budgetLookup = useMemo(
    () => Object.fromEntries(budgets.map((item) => [item.id, item])),
    [budgets],
  );

  const filtered = useMemo(() => {
    return expenses.filter((item) => {
      const matchesBudget =
        !historyBudgetId || item.budgetId === historyBudgetId;
      const matchesCategory =
        category === "All" || item.category === category;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        item.category.toLowerCase().includes(q) ||
        item.paymentMethod.toLowerCase().includes(q) ||
        (item.note ?? "").toLowerCase().includes(q) ||
        String(item.amount).includes(q);
      return matchesBudget && matchesCategory && matchesSearch;
    });
  }, [expenses, search, category, historyBudgetId]);

  const { page, setPage, pageCount, pageItems, pageSize, total } =
    usePagination(
      filtered,
      5,
      `${search}-${category}-${historyBudgetId}-${filtered.length}`,
    );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (skipConfirm.current) return;
    event.preventDefault();
    setConfirm({ type: editing ? "update" : "create" });
  }

  function handleConfirm() {
    if (!confirm) return;

    if (confirm.type === "create" || confirm.type === "update") {
      skipConfirm.current = true;
      setConfirm(null);
      formRef.current?.requestSubmit();
      skipConfirm.current = false;
      return;
    }

    const id = confirm.expense.id;
    startDeleteTransition(async () => {
      const result = await deleteExpense(id);
      setConfirm(null);
      if (result.error) toast.error(result.error);
      else toast.success(result.success ?? "Expense deleted");
    });
  }

  const confirmCopy =
    confirm?.type === "delete"
      ? {
          title: "Delete expense?",
          description: `This will permanently delete the ${formatCurrency(confirm.expense.amount)} ${confirm.expense.category} expense. This action cannot be undone.`,
          confirmLabel: "Delete",
          variant: "danger" as const,
          pending: deletePending,
        }
      : confirm?.type === "update"
        ? {
            title: "Save expense changes?",
            description: `Update this ${editing ? formatCurrency(editing.amount) : ""} expense with the changes you made?`,
            confirmLabel: "Save changes",
            variant: "primary" as const,
            pending: updatePending,
          }
        : {
            title: "Add expense?",
            description: "Create this expense with the details you entered?",
            confirmLabel: "Add expense",
            variant: "primary" as const,
            pending: createPending,
          };

  const hasBudgets = budgets.length > 0;
  const budgetSelectOptions = budgets.map((item) => ({
    value: item.id,
    label: item.label,
  }));

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader
          title={editing ? "Edit expense" : "Add expense"}
          description="Choose a created budget, then add spending"
        />
        {!hasBudgets ? (
          <div className="rounded-xl border border-dashed border-(--border) px-4 py-8 text-center">
            <p className="text-sm text-(--muted)">
              Create a monthly budget first before adding expenses.
            </p>
            <Link href="/budget" className="mt-4 inline-block">
              <Button type="button">Go to Budget</Button>
            </Link>
          </div>
        ) : (
          <form
            ref={formRef}
            action={editing ? updateAction : createAction}
            className="space-y-3"
            key={`${editing?.id ?? "new"}-${formBudgetId}`}
            onSubmit={handleSubmit}
          >
            <Select
              name="budgetId"
              label="Budget"
              options={budgetSelectOptions}
              value={formBudgetId}
              onChange={(event) => setFormBudgetId(event.target.value)}
              required
            />
            <Input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              label="Amount"
              placeholder="25.50"
              defaultValue={editing?.amount}
              required
            />
            <Select
              name="category"
              label="Category"
              options={EXPENSE_CATEGORIES}
              defaultValue={editing?.category ?? "Food"}
            />
            <Select
              name="paymentMethod"
              label="Payment method"
              options={PAYMENT_METHODS}
              defaultValue={
                editing &&
                PAYMENT_METHODS.includes(
                  editing.paymentMethod as (typeof PAYMENT_METHODS)[number],
                )
                  ? editing.paymentMethod
                  : "Cash"
              }
            />
            <Input
              name="date"
              type="date"
              label="Date"
              min={
                selectedFormBudget
                  ? toDateInputValue(
                      new Date(
                        selectedFormBudget.year,
                        selectedFormBudget.month - 1,
                        1,
                      ),
                    )
                  : undefined
              }
              max={
                selectedFormBudget
                  ? toDateInputValue(
                      new Date(
                        selectedFormBudget.year,
                        selectedFormBudget.month,
                        0,
                      ),
                    )
                  : undefined
              }
              defaultValue={
                editing
                  ? toDateInputValue(editing.date)
                  : defaultDateForBudget(selectedFormBudget)
              }
              required
            />
            <Textarea
              name="note"
              label="Notes"
              placeholder="Optional note"
              defaultValue={editing?.note ?? ""}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={createPending || updatePending}>
                {editing
                  ? updatePending
                    ? "Saving..."
                    : "Save changes"
                  : createPending
                    ? "Adding..."
                    : "Add expense"}
              </Button>
              {editing ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Expense history"
          description="Filtered by selected budget"
        />
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_180px]">
          <Select
            label="Budget"
            options={
              hasBudgets
                ? budgetSelectOptions
                : [{ value: "", label: "No budgets yet" }]
            }
            value={historyBudgetId}
            onChange={(event) => setHistoryBudgetId(event.target.value)}
            disabled={!hasBudgets}
          />
          <Input
            label="Search"
            placeholder="Search notes, category, amount..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            label="Filter category"
            options={["All", ...EXPENSE_CATEGORIES]}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {!hasBudgets ? (
            <p className="rounded-xl border border-dashed border-(--border) px-4 py-10 text-center text-sm text-(--muted)">
              Create a budget to start tracking expense history.
            </p>
          ) : filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-(--border) px-4 py-10 text-center text-sm text-(--muted)">
              No expenses for this budget
              {category !== "All" || search ? " with current filters" : ""}.
            </p>
          ) : (
            pageItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-(--border) bg-(--surface-2)/50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      {formatCurrency(item.amount)}
                    </p>
                    <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs text-orange-600 dark:text-orange-300">
                      {item.category}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-(--muted)">
                    {item.budgetId && budgetLookup[item.budgetId]
                      ? `${budgetLookup[item.budgetId].label} · `
                      : ""}
                    {format(new Date(item.date), "MMM d, yyyy")} ·{" "}
                    {item.paymentMethod}
                  </p>
                  {item.note ? (
                    <p className="mt-1 text-sm text-(--muted-2)">
                      {item.note}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditing(item)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      setConfirm({ type: "delete", expense: item })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </Card>

      <ConfirmDialog
        open={confirm !== null}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        variant={confirmCopy.variant}
        pending={confirmCopy.pending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

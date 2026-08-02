"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  createExpense,
  deleteExpense,
  updateExpense,
} from "@/actions/expenses";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import { formatCurrency, toDateInputValue } from "@/lib/utils";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";

type Expense = {
  id: string;
  amount: number;
  category: string;
  paymentMethod: string;
  note: string | null;
  date: string | Date;
};

type ConfirmState =
  | { type: "update" }
  | { type: "delete"; expense: Expense }
  | null;

export function ExpenseManager({ expenses }: { expenses: Expense[] }) {
  const [editing, setEditing] = useState<Expense | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const skipUpdateConfirm = useRef(false);
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

  useEffect(() => {
    if (wasUpdatePending.current && !updatePending && updateState.success) {
      setEditing(null);
    }
    wasUpdatePending.current = updatePending;
  }, [updatePending, updateState.success]);

  const filtered = useMemo(() => {
    return expenses.filter((item) => {
      const matchesCategory =
        category === "All" || item.category === category;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        item.category.toLowerCase().includes(q) ||
        item.paymentMethod.toLowerCase().includes(q) ||
        (item.note ?? "").toLowerCase().includes(q) ||
        String(item.amount).includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [expenses, search, category]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (editing && !skipUpdateConfirm.current) {
      event.preventDefault();
      setConfirm({ type: "update" });
      return;
    }
  }

  function handleConfirm() {
    if (!confirm) return;

    if (confirm.type === "update") {
      skipUpdateConfirm.current = true;
      setConfirm(null);
      formRef.current?.requestSubmit();
      skipUpdateConfirm.current = false;
      return;
    }

    const id = confirm.expense.id;
    startDeleteTransition(async () => {
      await deleteExpense(id);
      setConfirm(null);
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader
          title={editing ? "Edit expense" : "Add expense"}
          description="Track every payment with category and method"
        />
        <form
          ref={formRef}
          action={editing ? updateAction : createAction}
          className="space-y-3"
          key={editing?.id ?? "new"}
          onSubmit={handleSubmit}
        >
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
            defaultValue={editing?.paymentMethod ?? "Card"}
          />
          <Input
            name="date"
            type="date"
            label="Date"
            defaultValue={
              editing
                ? toDateInputValue(editing.date)
                : toDateInputValue(new Date())
            }
            required
          />
          <Textarea
            name="note"
            label="Notes"
            placeholder="Optional note"
            defaultValue={editing?.note ?? ""}
          />
          <FormMessage
            error={editing ? updateState.error : createState.error}
            success={
              editing
                ? updateState.success
                : createState.success ?? updateState.success
            }
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={createPending || updatePending}>
              {editing ? "Save changes" : "Add expense"}
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
      </Card>

      <Card>
        <CardHeader
          title="Expense history"
          description="Search and filter your spending"
        />
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px]">
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
          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-(--border) px-4 py-10 text-center text-sm text-(--muted)">
              No expenses match your filters.
            </p>
          ) : (
            filtered.map((item) => (
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
        </div>
      </Card>

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm?.type === "delete"
            ? "Delete expense?"
            : "Save expense changes?"
        }
        description={
          confirm?.type === "delete"
            ? `This will permanently delete the ${formatCurrency(confirm.expense.amount)} ${confirm.expense.category} expense. This action cannot be undone.`
            : `Update this ${editing ? formatCurrency(editing.amount) : ""} expense with the changes you made?`
        }
        confirmLabel={confirm?.type === "delete" ? "Delete" : "Save changes"}
        variant={confirm?.type === "delete" ? "danger" : "primary"}
        pending={confirm?.type === "delete" ? deletePending : updatePending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

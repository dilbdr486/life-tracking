"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { periodDateRange } from "@/lib/budget-period";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatCurrency } from "@/lib/utils";
import { expenseSchema } from "@/lib/validations";
import { Budget, Expense, Notification } from "@/models";

export type ActionState = { error?: string; success?: string };

async function maybeBudgetWarning(userId: string, budgetId: string) {
  if (!mongoose.isValidObjectId(budgetId)) return;

  const budget = await Budget.findOne({ _id: budgetId, userId }).lean();
  if (!budget || budget.monthlyBudget <= 0) return;

  const { start, end } = periodDateRange({
    year: budget.year,
    month: budget.month,
  });
  const spent = await Expense.aggregate<{ total: number }>([
    {
      $match: {
        userId: budget.userId,
        budgetId: budget._id,
        date: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const total = spent[0]?.total ?? 0;
  const ratio = total / budget.monthlyBudget;

  if (ratio >= 1) {
    await Notification.create({
      userId,
      title: "Budget exceeded",
      message: `You've spent ${formatCurrency(total)} of your ${formatCurrency(budget.monthlyBudget)} monthly budget.`,
      type: "warning",
    });
  } else if (ratio >= 0.8) {
    await Notification.create({
      userId,
      title: "Budget limit warning",
      message: `You've used ${(ratio * 100).toFixed(0)}% of your monthly budget.`,
      type: "warning",
    });
  }
}

async function resolveBudgetForUser(userId: string, budgetId: string) {
  if (!mongoose.isValidObjectId(budgetId)) {
    return { error: "Select a valid budget" as const };
  }

  const budget = await Budget.findOne({
    _id: budgetId,
    userId,
    year: { $exists: true, $ne: null },
    month: { $exists: true, $ne: null },
  }).lean();

  if (!budget) {
    return { error: "Selected budget was not found. Create a budget first." as const };
  }

  return { budget };
}

function isDateInBudgetMonth(
  date: Date,
  year: number,
  month: number,
) {
  return date.getFullYear() === year && date.getMonth() + 1 === month;
}

export async function createExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = expenseSchema.safeParse({
    budgetId: formData.get("budgetId"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    paymentMethod: formData.get("paymentMethod"),
    date: formData.get("date"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await connectDB();
  const resolved = await resolveBudgetForUser(user.id, parsed.data.budgetId);
  if ("error" in resolved) return { error: resolved.error };

  const expenseDate = new Date(parsed.data.date);
  if (
    !isDateInBudgetMonth(
      expenseDate,
      resolved.budget.year,
      resolved.budget.month,
    )
  ) {
    return {
      error: "Expense date must be within the selected budget month",
    };
  }

  await Expense.create({
    userId: user.id,
    budgetId: resolved.budget._id,
    amount: parsed.data.amount,
    category: parsed.data.category,
    paymentMethod: parsed.data.paymentMethod,
    date: expenseDate,
    note: parsed.data.note ?? null,
  });

  await maybeBudgetWarning(user.id, resolved.budget._id.toString());

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/budget");
  revalidatePath("/reports");
  revalidatePath("/notifications");
  return { success: "Expense added" };
}

export async function updateExpense(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = expenseSchema.safeParse({
    budgetId: formData.get("budgetId"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    paymentMethod: formData.get("paymentMethod"),
    date: formData.get("date"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await connectDB();
  const existing = await Expense.findOne({ _id: id, userId: user.id });
  if (!existing) return { error: "Expense not found" };

  const resolved = await resolveBudgetForUser(user.id, parsed.data.budgetId);
  if ("error" in resolved) return { error: resolved.error };

  const expenseDate = new Date(parsed.data.date);
  if (
    !isDateInBudgetMonth(
      expenseDate,
      resolved.budget.year,
      resolved.budget.month,
    )
  ) {
    return {
      error: "Expense date must be within the selected budget month",
    };
  }

  existing.budgetId = resolved.budget._id;
  existing.amount = parsed.data.amount;
  existing.category = parsed.data.category;
  existing.paymentMethod = parsed.data.paymentMethod;
  existing.date = expenseDate;
  existing.note = parsed.data.note ?? null;
  await existing.save();

  await maybeBudgetWarning(user.id, resolved.budget._id.toString());

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/budget");
  revalidatePath("/reports");
  revalidatePath("/notifications");
  return { success: "Expense updated" };
}

export async function deleteExpense(id: string): Promise<ActionState> {
  const user = await requireUser();
  await connectDB();
  const existing = await Expense.findOneAndDelete({
    _id: id,
    userId: user.id,
  });
  if (!existing) return { error: "Expense not found" };

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/budget");
  revalidatePath("/reports");
  return { success: "Expense deleted" };
}

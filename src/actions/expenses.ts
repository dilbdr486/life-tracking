"use server";

import { revalidatePath } from "next/cache";
import { currentBudgetPeriod, periodDateRange } from "@/lib/budget-period";
import { findBudgetForPeriod } from "@/lib/budget-queries";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatCurrency } from "@/lib/utils";
import { expenseSchema } from "@/lib/validations";
import { Expense, Notification } from "@/models";

export type ActionState = { error?: string; success?: string };

async function maybeBudgetWarning(userId: string) {
  const period = currentBudgetPeriod();
  const budget = await findBudgetForPeriod(userId, period);
  if (!budget || budget.monthlyBudget <= 0) return;

  const { start, end } = periodDateRange(period);
  const spent = await Expense.aggregate<{ total: number }>([
    {
      $match: {
        userId: budget.userId,
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

export async function createExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = expenseSchema.safeParse({
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
  await Expense.create({
    userId: user.id,
    amount: parsed.data.amount,
    category: parsed.data.category,
    paymentMethod: parsed.data.paymentMethod,
    date: new Date(parsed.data.date),
    note: parsed.data.note ?? null,
  });

  await maybeBudgetWarning(user.id);

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

  existing.amount = parsed.data.amount;
  existing.category = parsed.data.category;
  existing.paymentMethod = parsed.data.paymentMethod;
  existing.date = new Date(parsed.data.date);
  existing.note = parsed.data.note ?? null;
  await existing.save();

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/budget");
  revalidatePath("/reports");
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

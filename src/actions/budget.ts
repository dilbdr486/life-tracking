"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { formatBudgetPeriod, parsePeriodInput } from "@/lib/budget-period";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { requireUser } from "@/lib/session";
import { formatCurrency } from "@/lib/utils";
import { budgetSchema } from "@/lib/validations";
import { Budget, CategoryBudget, Notification } from "@/models";

export type ActionState = { error?: string; success?: string };

export async function saveBudget(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const periodFromInput = parsePeriodInput(
    String(formData.get("period") ?? ""),
  );
  const year = periodFromInput?.year ?? Number(formData.get("year"));
  const month = periodFromInput?.month ?? Number(formData.get("month"));

  const categoryBudgets = EXPENSE_CATEGORIES.map((category) => ({
    category,
    amount: Number(formData.get(`cat_${category}`) ?? 0),
  }));

  const parsed = budgetSchema.safeParse({
    year,
    month,
    monthlyIncome: formData.get("monthlyIncome"),
    monthlyBudget: formData.get("monthlyBudget"),
    savingsGoal: formData.get("savingsGoal"),
    categoryBudgets,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const period = { year: parsed.data.year, month: parsed.data.month };
  const mode = String(formData.get("mode") ?? "create");

  await connectDB();

  const existing = await Budget.findOne({
    userId: user.id,
    year: period.year,
    month: period.month,
  }).lean();

  if (mode === "create" && existing) {
    return {
      error: `A budget for ${formatBudgetPeriod(period)} already exists. Edit it from the list instead.`,
    };
  }

  if (mode === "edit" && !existing) {
    return {
      error: `No budget found for ${formatBudgetPeriod(period)}. Create one first.`,
    };
  }

  await Budget.findOneAndUpdate(
    {
      userId: user.id,
      year: period.year,
      month: period.month,
    },
    {
      userId: user.id,
      year: period.year,
      month: period.month,
      monthlyIncome: parsed.data.monthlyIncome,
      monthlyBudget: parsed.data.monthlyBudget,
      savingsGoal: parsed.data.savingsGoal,
    },
    { upsert: true, returnDocument: "after" },
  );

  await Promise.all(
    categoryBudgets.map((item) =>
      CategoryBudget.findOneAndUpdate(
        {
          userId: user.id,
          year: period.year,
          month: period.month,
          category: item.category,
        },
        {
          userId: user.id,
          year: period.year,
          month: period.month,
          category: item.category,
          amount: item.amount,
        },
        { upsert: true, returnDocument: "after" },
      ),
    ),
  );

  const label = formatBudgetPeriod(period);
  await Notification.create({
    userId: user.id,
    title: existing ? "Budget updated" : "Budget created",
    message: `${label} budget set to ${formatCurrency(parsed.data.monthlyBudget)}. Savings goal: ${formatCurrency(parsed.data.savingsGoal)}.`,
    type: "info",
  });

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return {
    success: existing
      ? `Budget updated for ${label}`
      : `Budget created for ${label}`,
  };
}

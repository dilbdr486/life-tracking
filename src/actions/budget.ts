"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { requireUser } from "@/lib/session";
import { budgetSchema } from "@/lib/validations";
import { Budget, CategoryBudget, Notification } from "@/models";

export type ActionState = { error?: string; success?: string };

export async function saveBudget(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const categoryBudgets = EXPENSE_CATEGORIES.map((category) => ({
    category,
    amount: Number(formData.get(`cat_${category}`) ?? 0),
  }));

  const parsed = budgetSchema.safeParse({
    monthlyIncome: formData.get("monthlyIncome"),
    monthlyBudget: formData.get("monthlyBudget"),
    savingsGoal: formData.get("savingsGoal"),
    categoryBudgets,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await connectDB();

  await Budget.findOneAndUpdate(
    { userId: user.id },
    {
      userId: user.id,
      monthlyIncome: parsed.data.monthlyIncome,
      monthlyBudget: parsed.data.monthlyBudget,
      savingsGoal: parsed.data.savingsGoal,
    },
    { upsert: true, new: true },
  );

  await Promise.all(
    categoryBudgets.map((item) =>
      CategoryBudget.findOneAndUpdate(
        { userId: user.id, category: item.category },
        {
          userId: user.id,
          category: item.category,
          amount: item.amount,
        },
        { upsert: true, new: true },
      ),
    ),
  );

  await Notification.create({
    userId: user.id,
    title: "Budget updated",
    message: `Monthly budget set to $${parsed.data.monthlyBudget.toFixed(2)}. Savings goal: $${parsed.data.savingsGoal.toFixed(2)}.`,
    type: "info",
  });

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return { success: "Budget saved" };
}

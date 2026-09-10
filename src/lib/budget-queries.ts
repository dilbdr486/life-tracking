import mongoose from "mongoose";
import type { BudgetPeriod } from "@/lib/budget-period";
import { Budget, CategoryBudget } from "@/models";

export async function findBudgetForPeriod(
  userId: string | mongoose.Types.ObjectId,
  period: BudgetPeriod,
) {
  const scoped = await Budget.findOne({
    userId,
    year: period.year,
    month: period.month,
  }).lean();
  if (scoped) return scoped;

  return Budget.findOne({
    userId,
    $or: [{ year: { $exists: false } }, { year: null }],
  }).lean();
}

export async function findCategoryBudgetsForPeriod(
  userId: string | mongoose.Types.ObjectId,
  period: BudgetPeriod,
) {
  const scoped = await CategoryBudget.find({
    userId,
    year: period.year,
    month: period.month,
  }).lean();
  if (scoped.length > 0) return scoped;

  return CategoryBudget.find({
    userId,
    $or: [{ year: { $exists: false } }, { year: null }],
  }).lean();
}

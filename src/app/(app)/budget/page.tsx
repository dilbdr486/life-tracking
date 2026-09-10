import { redirect } from "next/navigation";
import {
  BudgetManager,
  type BudgetListItem,
} from "@/components/budget/budget-manager";
import { Topbar } from "@/components/layout/topbar";
import { periodDateRange } from "@/lib/budget-period";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Budget, CategoryBudget, Expense } from "@/models";

export default async function BudgetPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();

  const [budgets, categoryBudgets] = await Promise.all([
    Budget.find({
      userId: session.user.id,
      year: { $exists: true, $ne: null },
      month: { $exists: true, $ne: null },
    })
      .sort({ year: -1, month: -1 })
      .lean(),
    CategoryBudget.find({
      userId: session.user.id,
      year: { $exists: true, $ne: null },
      month: { $exists: true, $ne: null },
    }).lean(),
  ]);

  const categoryByPeriod = new Map<string, Record<string, number>>();
  for (const item of categoryBudgets) {
    const key = `${item.year}-${item.month}`;
    const current = categoryByPeriod.get(key) ?? {};
    current[item.category] = item.amount;
    categoryByPeriod.set(key, current);
  }

  let expenses: Array<{ amount: number; category: string; date: Date }> = [];
  if (budgets.length > 0) {
    const ranges = budgets.map((budget) =>
      periodDateRange({
        year: budget.year as number,
        month: budget.month as number,
      }),
    );
    const minStart = ranges.reduce(
      (min, range) => (range.start < min ? range.start : min),
      ranges[0].start,
    );
    const maxEnd = ranges.reduce(
      (max, range) => (range.end > max ? range.end : max),
      ranges[0].end,
    );

    expenses = await Expense.find({
      userId: session.user.id,
      date: { $gte: minStart, $lte: maxEnd },
    })
      .select("amount category date")
      .lean();
  }

  const list: BudgetListItem[] = budgets.map((budget) => {
    const year = budget.year as number;
    const month = budget.month as number;
    const { start, end } = periodDateRange({ year, month });
    const spentByCategory: Record<string, number> = {};
    let monthSpend = 0;

    for (const expense of expenses) {
      const date = new Date(expense.date);
      if (date < start || date > end) continue;
      monthSpend += expense.amount;
      spentByCategory[expense.category] =
        (spentByCategory[expense.category] ?? 0) + expense.amount;
    }

    return {
      id: budget._id.toString(),
      year,
      month,
      monthlyIncome: budget.monthlyIncome ?? 0,
      monthlyBudget: budget.monthlyBudget ?? 0,
      savingsGoal: budget.savingsGoal ?? 0,
      categoryBudgets: categoryByPeriod.get(`${year}-${month}`) ?? {},
      monthSpend,
      spentByCategory,
    };
  });

  return (
    <>
      <Topbar
        title="Budget Management"
        subtitle="List, create, and update monthly budgets"
        userName={session.user.name}
      />
      <main className="px-4 py-6 md:px-8">
        <BudgetManager budgets={list} />
      </main>
    </>
  );
}

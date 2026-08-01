import { endOfMonth, startOfMonth } from "date-fns";
import { redirect } from "next/navigation";
import { BudgetForm } from "@/components/budget/budget-form";
import { Topbar } from "@/components/layout/topbar";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Budget, CategoryBudget, Expense } from "@/models";

export default async function BudgetPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [budget, categoryBudgets, expenses] = await Promise.all([
    Budget.findOne({ userId: session.user.id }).lean(),
    CategoryBudget.find({ userId: session.user.id }).lean(),
    Expense.find({
      userId: session.user.id,
      date: { $gte: monthStart, $lte: monthEnd },
    }).lean(),
  ]);

  const categoryMap = Object.fromEntries(
    categoryBudgets.map((item) => [item.category, item.amount]),
  );
  const spentByCategory: Record<string, number> = {};
  let monthSpend = 0;
  for (const expense of expenses) {
    monthSpend += expense.amount;
    spentByCategory[expense.category] =
      (spentByCategory[expense.category] ?? 0) + expense.amount;
  }

  return (
    <>
      <Topbar
        title="Budget Management"
        subtitle="Income, limits, category budgets, and savings"
        userName={session.user.name}
      />
      <main className="px-4 py-6 md:px-8">
        <BudgetForm
          monthlyIncome={budget?.monthlyIncome ?? 0}
          monthlyBudget={budget?.monthlyBudget ?? 0}
          savingsGoal={budget?.savingsGoal ?? 0}
          categoryBudgets={categoryMap}
          monthSpend={monthSpend}
          spentByCategory={spentByCategory}
        />
      </main>
    </>
  );
}

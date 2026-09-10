import { redirect } from "next/navigation";
import { ExpenseManager } from "@/components/expenses/expense-manager";
import { Topbar } from "@/components/layout/topbar";
import { auth } from "@/lib/auth";
import { formatBudgetPeriod } from "@/lib/budget-period";
import { connectDB } from "@/lib/db";
import { toPlainList } from "@/lib/serialize";
import { Budget, Expense } from "@/models";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const [expenses, budgets] = await Promise.all([
    Expense.find({ userId: session.user.id })
      .sort({ date: -1, createdAt: -1 })
      .lean(),
    Budget.find({
      userId: session.user.id,
      year: { $exists: true, $ne: null },
      month: { $exists: true, $ne: null },
    })
      .sort({ year: -1, month: -1 })
      .lean(),
  ]);

  const budgetOptions = budgets.map((budget) => ({
    id: budget._id.toString(),
    year: budget.year as number,
    month: budget.month as number,
    label: formatBudgetPeriod({
      year: budget.year as number,
      month: budget.month as number,
    }),
    monthlyBudget: budget.monthlyBudget ?? 0,
  }));

  return (
    <>
      <Topbar
        title="Expense Tracker"
        subtitle="Add spending against a monthly budget"
        userName={session.user.name}
      />
      <main className="px-4 py-6 md:px-8">
        <ExpenseManager
          budgets={budgetOptions}
          expenses={toPlainList(expenses).map((item) => ({
            id: item.id,
            budgetId:
              item.budgetId == null ? null : String(item.budgetId),
            amount: Number(item.amount),
            category: String(item.category),
            paymentMethod: String(item.paymentMethod),
            note: item.note == null ? null : String(item.note),
            date:
              item.date instanceof Date
                ? item.date.toISOString()
                : String(item.date),
          }))}
        />
      </main>
    </>
  );
}

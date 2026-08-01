import { redirect } from "next/navigation";
import { ExpenseManager } from "@/components/expenses/expense-manager";
import { Topbar } from "@/components/layout/topbar";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { toPlainList } from "@/lib/serialize";
import { Expense } from "@/models";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const expenses = await Expense.find({ userId: session.user.id })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  return (
    <>
      <Topbar
        title="Expense Tracker"
        subtitle="Search, filter, and manage spending"
        userName={session.user.name}
      />
      <main className="px-4 py-6 md:px-8">
        <ExpenseManager
          expenses={toPlainList(expenses).map((item) => ({
            id: item.id,
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

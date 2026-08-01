import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/lib/stats";
import { formatCurrency, formatHours } from "@/lib/utils";
import {
  Activity,
  Bell,
  Clock3,
  Plus,
  Receipt,
  Wallet,
} from "lucide-react";
import { redirect } from "next/navigation";
import { format } from "date-fns";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const stats = await getDashboardStats(session.user.id);

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={stats.dateLabel}
        userName={session.user.name}
      />
      <main className="space-y-6 px-4 py-6 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            icon={<Clock3 className="h-4 w-4" />}
            label="Time tracked today"
            value={formatHours(stats.totalTimeToday)}
          />
          <Stat
            icon={<Receipt className="h-4 w-4" />}
            label="Today's expenses"
            value={formatCurrency(stats.todaySpend)}
          />
          <Stat
            icon={<Wallet className="h-4 w-4" />}
            label="Budget remaining"
            value={formatCurrency(stats.budgetRemaining)}
          />
          <Stat
            icon={<Bell className="h-4 w-4" />}
            label="Unread alerts"
            value={String(stats.unread)}
          />
        </div>

        <div className="flex flex-wrap gap-3 animate-rise">
          <Link href="/activities">
            <Button>
              <Plus className="h-4 w-4" />
              Quick add activity
            </Button>
          </Link>
          <Link href="/expenses">
            <Button variant="secondary">
              <Plus className="h-4 w-4" />
              Quick add expense
            </Button>
          </Link>
          <Link href="/budget">
            <Button variant="ghost">Manage budget</Button>
          </Link>
          <Link href="/notifications">
            <Button variant="ghost">View notifications</Button>
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="animate-rise stagger-1">
            <CardHeader
              title="Today's activities"
              description="What you tracked so far"
              action={
                <Link href="/activities" className="text-sm text-(--accent)">
                  View all
                </Link>
              }
            />
            <div className="space-y-3">
              {stats.todayActivities.length === 0 ? (
                <Empty
                  icon={<Activity className="h-4 w-4" />}
                  text="No activities logged today."
                />
              ) : (
                stats.todayActivities.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-(--border) px-3 py-3"
                  >
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-(--muted)">
                        {item.category} · {item.startTime}–{item.endTime}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-(--accent)">
                      {formatHours(item.duration)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="animate-rise stagger-2">
            <CardHeader
              title="Today's expenses"
              description="Spending captured today"
              action={
                <Link href="/expenses" className="text-sm text-(--accent)">
                  View all
                </Link>
              }
            />
            <div className="space-y-3">
              {stats.todayExpenses.length === 0 ? (
                <Empty
                  icon={<Receipt className="h-4 w-4" />}
                  text="No expenses logged today."
                />
              ) : (
                stats.todayExpenses.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-(--border) px-3 py-3"
                  >
                    <div>
                      <p className="font-medium">{item.category}</p>
                      <p className="text-sm text-(--muted)">
                        {item.paymentMethod} ·{" "}
                        {format(item.date, "MMM d")}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="animate-rise">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-(--accent)/12 text-(--accent)">
        {icon}
      </div>
      <p className="text-sm text-(--muted)">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">
        {value}
      </p>
    </Card>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-(--border) px-4 py-8 text-sm text-(--muted)">
      {icon}
      {text}
    </div>
  );
}

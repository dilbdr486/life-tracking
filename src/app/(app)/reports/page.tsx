import { redirect } from "next/navigation";
import { ReportCharts } from "@/components/charts/report-charts";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getReportData } from "@/lib/stats";
import { formatCurrency } from "@/lib/utils";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await getReportData(session.user.id);

  return (
    <>
      <Topbar
        title="Reports & Charts"
        subtitle="Time and money insights at a glance"
        userName={session.user.name}
      />
      <main className="space-y-6 px-4 py-6 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Summary label="Week hours" value={`${data.weekHours}h`} />
          <Summary label="Month hours" value={`${data.monthHours}h`} />
          <Summary
            label="Week spending"
            value={formatCurrency(data.weekSpend)}
          />
          <Summary
            label="Month spending"
            value={formatCurrency(data.monthSpend)}
          />
        </div>

        {data.expenseByCategory.length === 0 &&
        data.timeByCategory.length === 0 ? (
          <Card className="px-4 py-12 text-center text-sm text-(--muted)">
            Add activities and expenses to unlock charts and reports.
          </Card>
        ) : (
          <ReportCharts
            expenseByCategory={data.expenseByCategory}
            timeByCategory={data.timeByCategory}
            dailySpend={data.dailySpend}
            dailyHours={data.dailyHours}
          />
        )}
      </main>
    </>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-(--muted)">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </Card>
  );
}

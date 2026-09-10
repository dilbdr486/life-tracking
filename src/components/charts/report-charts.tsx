"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ACTIVITY_COLORS, EXPENSE_COLORS } from "@/lib/constants";
import { Card, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type Slice = { name: string; value: number };

function currencyTooltipValue(value: unknown) {
  const amount = Array.isArray(value)
    ? Number(value[0] ?? 0)
    : Number(value ?? 0);
  return formatCurrency(Number.isFinite(amount) ? amount : 0);
}

export function ReportCharts({
  expenseByCategory,
  timeByCategory,
  dailySpend,
  dailyHours,
}: {
  expenseByCategory: Slice[];
  timeByCategory: Slice[];
  dailySpend: Slice[];
  dailyHours: Slice[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader
          title="Expense breakdown"
          description="Where your money went this month"
        />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseByCategory}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
              >
                {expenseByCategory.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={EXPENSE_COLORS[entry.name] ?? "#64748b"}
                  />
                ))}
              </Pie>
              <Tooltip formatter={currencyTooltipValue} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Time usage"
          description="Hours by activity category"
        />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={timeByCategory}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
              >
                {timeByCategory.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={ACTIVITY_COLORS[entry.name] ?? "#64748b"}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Daily spending"
          description="Last 14 days bar chart"
        />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailySpend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={currencyTooltipValue} />
              <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Weekly productivity"
          description="Hours tracked per day"
        />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyHours}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader
          title="Spending over time"
          description="Trend line for the last two weeks"
        />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailySpend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={currencyTooltipValue} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ea580c"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

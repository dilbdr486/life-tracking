import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  differenceInCalendarDays,
} from "date-fns";
import mongoose from "mongoose";
import { currentBudgetPeriod } from "@/lib/budget-period";
import { findBudgetForPeriod } from "@/lib/budget-queries";
import { connectDB } from "@/lib/db";
import { Activity, Expense, Notification } from "@/models";

export async function getDashboardStats(userId: string) {
  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const period = currentBudgetPeriod(now);

  const [todayActivities, todayExpenses, monthSpendAgg, budget, unread] =
    await Promise.all([
      Activity.find({
        userId: userObjectId,
        date: { $gte: todayStart, $lt: tomorrow },
      })
        .sort({ startTime: 1 })
        .lean(),
      Expense.find({
        userId: userObjectId,
        date: { $gte: todayStart, $lt: tomorrow },
      })
        .sort({ createdAt: -1 })
        .lean(),
      Expense.aggregate<{ total: number }>([
        {
          $match: {
            userId: userObjectId,
            date: { $gte: monthStart, $lte: monthEnd },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      findBudgetForPeriod(userObjectId, period),
      Notification.countDocuments({ userId: userObjectId, read: false }),
    ]);

  const totalTimeToday = todayActivities.reduce(
    (sum, item) => sum + item.duration,
    0,
  );
  const todaySpend = todayExpenses.reduce((sum, item) => sum + item.amount, 0);
  const monthSpend = monthSpendAgg[0]?.total ?? 0;
  const monthlyBudget = budget?.monthlyBudget ?? 0;

  return {
    todayActivities: todayActivities.map((item) => ({
      id: item._id.toString(),
      title: item.title,
      category: item.category,
      startTime: item.startTime,
      endTime: item.endTime,
      duration: item.duration,
      date: item.date,
    })),
    todayExpenses: todayExpenses.map((item) => ({
      id: item._id.toString(),
      amount: item.amount,
      category: item.category,
      paymentMethod: item.paymentMethod,
      date: item.date,
    })),
    totalTimeToday,
    todaySpend,
    monthSpend,
    monthlyBudget,
    budgetRemaining: monthlyBudget - monthSpend,
    monthlyIncome: budget?.monthlyIncome ?? 0,
    savingsGoal: budget?.savingsGoal ?? 0,
    unread,
    dateLabel: format(now, "EEEE, MMMM d, yyyy"),
  };
}

export type SpendAnalyticsRange = {
  start: Date;
  end: Date;
};

export async function getSpendAnalytics(
  userId: string,
  range: SpendAnalyticsRange,
) {
  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const start = startOfDay(range.start);
  const end = new Date(range.end);
  end.setHours(23, 59, 59, 999);

  const expenses = await Expense.find({
    userId: userObjectId,
    date: { $gte: start, $lte: end },
  })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  const byCategory: Record<string, number> = {};
  const dailySpend: Record<string, number> = {};
  let totalSpend = 0;
  const dayCount = differenceInCalendarDays(end, start) + 1;
  const seedAllDays = dayCount > 0 && dayCount <= 62;

  if (seedAllDays) {
    for (const day of eachDayOfInterval({ start, end })) {
      dailySpend[format(day, "MMM d")] = 0;
    }
  }

  for (const expense of expenses) {
    totalSpend += expense.amount;
    byCategory[expense.category] =
      (byCategory[expense.category] ?? 0) + expense.amount;
    const key = format(expense.date, "MMM d");
    dailySpend[key] = (dailySpend[key] ?? 0) + expense.amount;
  }

  return {
    totalSpend: Number(totalSpend.toFixed(2)),
    expenseCount: expenses.length,
    byCategory: Object.entries(byCategory)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value),
    dailySpend: Object.entries(dailySpend).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    })),
    expenses: expenses.map((item) => ({
      id: item._id.toString(),
      amount: item.amount,
      category: item.category,
      paymentMethod: item.paymentMethod,
      note: item.note ?? null,
      date: item.date.toISOString(),
    })),
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export async function getReportData(userId: string) {
  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const last14 = subDays(startOfDay(now), 13);

  const [activities, expenses] = await Promise.all([
    Activity.find({
      userId: userObjectId,
      date: { $gte: monthStart, $lte: monthEnd },
    }).lean(),
    Expense.find({
      userId: userObjectId,
      date: { $gte: monthStart, $lte: monthEnd },
    }).lean(),
  ]);

  const timeByCategory: Record<string, number> = {};
  const expenseByCategory: Record<string, number> = {};
  const dailySpend: Record<string, number> = {};
  const dailyHours: Record<string, number> = {};

  for (const day of eachDayOfInterval({ start: last14, end: now })) {
    dailySpend[format(day, "MMM d")] = 0;
    dailyHours[format(day, "MMM d")] = 0;
  }

  for (const activity of activities) {
    timeByCategory[activity.category] =
      (timeByCategory[activity.category] ?? 0) + activity.duration;
    const key = format(activity.date, "MMM d");
    if (key in dailyHours) {
      dailyHours[key] += activity.duration / 60;
    }
  }

  for (const expense of expenses) {
    expenseByCategory[expense.category] =
      (expenseByCategory[expense.category] ?? 0) + expense.amount;
    const key = format(expense.date, "MMM d");
    if (key in dailySpend) {
      dailySpend[key] += expense.amount;
    }
  }

  const weekActivities = activities.filter(
    (a) => a.date >= weekStart && a.date <= weekEnd,
  );
  const weekExpenses = expenses.filter(
    (e) => e.date >= weekStart && e.date <= weekEnd,
  );

  return {
    timeByCategory: Object.entries(timeByCategory).map(([name, value]) => ({
      name,
      value: Number((value / 60).toFixed(1)),
    })),
    expenseByCategory: Object.entries(expenseByCategory).map(
      ([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
      }),
    ),
    dailySpend: Object.entries(dailySpend).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    })),
    dailyHours: Object.entries(dailyHours).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(1)),
    })),
    weekHours: Number(
      (weekActivities.reduce((sum, a) => sum + a.duration, 0) / 60).toFixed(1),
    ),
    weekSpend: Number(
      weekExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2),
    ),
    monthHours: Number(
      (activities.reduce((sum, a) => sum + a.duration, 0) / 60).toFixed(1),
    ),
    monthSpend: Number(
      expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2),
    ),
  };
}

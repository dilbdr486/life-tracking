"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatCurrency } from "@/lib/utils";
import { Activity, Budget, Expense, Notification } from "@/models";

export async function markNotificationRead(id: string) {
  const user = await requireUser();
  await connectDB();
  await Notification.updateOne(
    { _id: id, userId: user.id },
    { $set: { read: true } },
  );
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await connectDB();
  await Notification.updateMany(
    { userId: user.id, read: false },
    { $set: { read: true } },
  );
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function createDailyReminders() {
  const user = await requireUser();
  await connectDB();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const userObjectId = new mongoose.Types.ObjectId(user.id);

  const [activityCount, expenseCount] = await Promise.all([
    Activity.countDocuments({
      userId: userObjectId,
      date: { $gte: today, $lt: tomorrow },
    }),
    Expense.countDocuments({
      userId: userObjectId,
      date: { $gte: today, $lt: tomorrow },
    }),
  ]);

  const created = [];

  if (activityCount === 0) {
    created.push(
      Notification.create({
        userId: userObjectId,
        title: "Log today's activities",
        message: "You haven't tracked any activities today yet.",
        type: "reminder",
      }),
    );
  }

  if (expenseCount === 0) {
    created.push(
      Notification.create({
        userId: userObjectId,
        title: "Log today's expenses",
        message: "Keep your spending in sync — add today's expenses.",
        type: "reminder",
      }),
    );
  }

  const budget = await Budget.findOne({ userId: userObjectId }).lean();
  if (budget && budget.savingsGoal > 0) {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const spent = await Expense.aggregate<{ total: number }>([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: monthStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const savedEstimate = Math.max(
      0,
      budget.monthlyIncome - (spent[0]?.total ?? 0),
    );
    if (savedEstimate < budget.savingsGoal) {
      created.push(
        Notification.create({
          userId: userObjectId,
          title: "Savings goal reminder",
          message: `Estimated savings this month: ${formatCurrency(savedEstimate)} of ${formatCurrency(budget.savingsGoal)} goal.`,
          type: "goal",
        }),
      );
    }
  }

  await Promise.all(created);
  revalidatePath("/notifications");
  return { success: true, count: created.length };
}

import { z } from "zod";
import {
  ACTIVITY_CATEGORIES,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
} from "@/lib/constants";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email"),
});

export const activitySchema = z.object({
  title: z.string().min(1, "Activity name is required"),
  category: z.enum(ACTIVITY_CATEGORIES),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  notes: z.string().optional(),
});

export const expenseSchema = z.object({
  budgetId: z.string().min(1, "Select a budget"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  category: z.enum(EXPENSE_CATEGORIES),
  paymentMethod: z.enum(PAYMENT_METHODS),
  date: z.string().min(1, "Date is required"),
  note: z.string().optional(),
});

export const budgetSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  monthlyIncome: z.coerce.number().min(0),
  monthlyBudget: z.coerce.number().min(0),
  savingsGoal: z.coerce.number().min(0),
  categoryBudgets: z
    .array(
      z.object({
        category: z.enum(EXPENSE_CATEGORIES),
        amount: z.coerce.number().min(0),
      }),
    )
    .optional(),
});

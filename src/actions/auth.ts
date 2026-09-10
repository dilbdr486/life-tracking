"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Budget, Notification, User } from "@/models";
import {
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations";

export type ActionState = {
  error?: string;
  success?: string;
  resetLink?: string;
};

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await connectDB();
  const email = parsed.data.email.toLowerCase();
  const existing = await User.findOne({ email }).lean();
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const hashed = await bcrypt.hash(parsed.data.password, 10);
  const user = await User.create({
    name: parsed.data.name,
    email,
    password: hashed,
  });

  const now = new Date();
  await Budget.create({
    userId: user._id,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    monthlyIncome: 0,
    monthlyBudget: 0,
    savingsGoal: 0,
  });

  await Notification.insertMany([
    {
      userId: user._id,
      title: "Welcome to LifeFlow",
      message:
        "Start by logging today's activities and expenses from your dashboard.",
      type: "info",
    },
    {
      userId: user._id,
      title: "Set your monthly budget",
      message: "Visit Budget to set income, limits, and savings goals.",
      type: "reminder",
    },
  ]);

  await signIn("credentials", {
    email: user.email,
    password: parsed.data.password,
    redirectTo: "/dashboard",
  });

  return { success: "Account created" };
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw error;
  }
  return { success: "Logged in" };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  await connectDB();
  const email = parsed.data.email.toLowerCase();
  const user = await User.findOne({ email });

  if (!user) {
    return {
      success:
        "If an account exists for that email, a reset link has been generated.",
    };
  }

  const token = randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  user.resetToken = token;
  user.resetTokenExpiry = expiry;
  await user.save();

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  return {
    success:
      "Reset link generated. In production this would be emailed to you.",
    resetLink: `${baseUrl}/reset-password?token=${token}`,
  };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await connectDB();
  const user = await User.findOne({
    resetToken: parsed.data.token,
    resetTokenExpiry: { $gt: new Date() },
  });

  if (!user) {
    return { error: "Reset link is invalid or has expired" };
  }

  user.password = await bcrypt.hash(parsed.data.password, 10);
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();

  redirect("/login?reset=1");
}

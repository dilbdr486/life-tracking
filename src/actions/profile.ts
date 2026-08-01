"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { profileSchema } from "@/lib/validations";
import { User } from "@/models";

export type ActionState = { error?: string; success?: string };

export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await connectDB();
  const email = parsed.data.email.toLowerCase();
  const taken = await User.findOne({
    email,
    _id: { $ne: user.id },
  }).lean();
  if (taken) return { error: "Email is already in use" };

  await User.findByIdAndUpdate(user.id, {
    name: parsed.data.name,
    email,
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: "Profile updated. Re-login if email changed." };
}

export async function changePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (newPassword.length < 6) {
    return { error: "New password must be at least 6 characters" };
  }

  await connectDB();
  const dbUser = await User.findById(user.id);
  if (!dbUser) return { error: "User not found" };

  const valid = await bcrypt.compare(currentPassword, dbUser.password);
  if (!valid) return { error: "Current password is incorrect" };

  dbUser.password = await bcrypt.hash(newPassword, 10);
  await dbUser.save();

  return { success: "Password changed" };
}

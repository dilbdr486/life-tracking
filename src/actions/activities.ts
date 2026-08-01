"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { calculateDurationMinutes } from "@/lib/utils";
import { activitySchema } from "@/lib/validations";
import { Activity } from "@/models";

export type ActionState = { error?: string; success?: string };

export async function createActivity(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = activitySchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const duration = calculateDurationMinutes(
    parsed.data.startTime,
    parsed.data.endTime,
  );
  if (duration <= 0) {
    return { error: "End time must be after start time" };
  }

  await connectDB();
  await Activity.create({
    userId: user.id,
    title: parsed.data.title,
    category: parsed.data.category,
    date: new Date(parsed.data.date),
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    duration,
    notes: parsed.data.notes ?? null,
  });

  revalidatePath("/activities");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { success: "Activity added" };
}

export async function updateActivity(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = activitySchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await connectDB();
  const existing = await Activity.findOne({ _id: id, userId: user.id });
  if (!existing) return { error: "Activity not found" };

  const duration = calculateDurationMinutes(
    parsed.data.startTime,
    parsed.data.endTime,
  );
  if (duration <= 0) {
    return { error: "End time must be after start time" };
  }

  existing.title = parsed.data.title;
  existing.category = parsed.data.category;
  existing.date = new Date(parsed.data.date);
  existing.startTime = parsed.data.startTime;
  existing.endTime = parsed.data.endTime;
  existing.duration = duration;
  existing.notes = parsed.data.notes ?? null;
  await existing.save();

  revalidatePath("/activities");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { success: "Activity updated" };
}

export async function deleteActivity(id: string): Promise<ActionState> {
  const user = await requireUser();
  await connectDB();
  const existing = await Activity.findOneAndDelete({
    _id: id,
    userId: user.id,
  });
  if (!existing) return { error: "Activity not found" };

  revalidatePath("/activities");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { success: "Activity deleted" };
}

import { redirect } from "next/navigation";
import { ActivityManager } from "@/components/activities/activity-manager";
import { Topbar } from "@/components/layout/topbar";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { toPlainList } from "@/lib/serialize";
import { Activity } from "@/models";

export default async function ActivitiesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const activities = await Activity.find({ userId: session.user.id })
    .sort({ date: -1, startTime: -1 })
    .lean();

  return (
    <>
      <Topbar
        title="Activity Tracker"
        subtitle="Log study, work, exercise, and more"
        userName={session.user.name}
      />
      <main className="px-4 py-6 md:px-8">
        <ActivityManager
          activities={toPlainList(activities).map((item) => ({
            id: item.id,
            title: String(item.title),
            category: String(item.category),
            date:
              item.date instanceof Date
                ? item.date.toISOString()
                : String(item.date),
            startTime: String(item.startTime),
            endTime: String(item.endTime),
            duration: Number(item.duration),
            notes: item.notes == null ? null : String(item.notes),
          }))}
        />
      </main>
    </>
  );
}

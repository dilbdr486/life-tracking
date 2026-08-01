import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { NotificationsPanel } from "@/components/notifications/notifications-panel";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { toPlainList } from "@/lib/serialize";
import { Notification } from "@/models";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const notifications = await Notification.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <>
      <Topbar
        title="Notifications"
        subtitle="Activity, expense, budget, and goal reminders"
        userName={session.user.name}
      />
      <main className="px-4 py-6 md:px-8">
        <NotificationsPanel
          notifications={toPlainList(notifications).map((item) => ({
            id: item.id,
            title: String(item.title),
            message: String(item.message),
            type: String(item.type),
            read: Boolean(item.read),
            createdAt:
              item.createdAt instanceof Date
                ? item.createdAt.toISOString()
                : String(item.createdAt),
          }))}
        />
      </main>
    </>
  );
}

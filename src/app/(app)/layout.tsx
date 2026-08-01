import { redirect } from "next/navigation";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const unread = await Notification.countDocuments({
    userId: session.user.id,
    read: false,
  });

  return (
    <div className="min-h-screen md:flex">
      <div className="hidden md:block">
        <div className="sticky top-0 h-screen">
          <Sidebar unread={unread} />
        </div>
      </div>
      <div className="flex min-h-screen flex-1 flex-col pb-20 md:pb-0">
        {children}
      </div>
      <MobileNav />
    </div>
  );
}

import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ProfileForms } from "@/components/profile/profile-forms";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user) redirect("/login");

  return (
    <>
      <Topbar
        title="User profile"
        subtitle="Manage account details and password"
        userName={user.name}
      />
      <main className="px-4 py-6 md:px-8">
        <ProfileForms name={user.name} email={user.email} />
      </main>
    </>
  );
}

import { resetPasswordAction } from "@/actions/auth";
import { AuthShell, ResetPasswordForm } from "@/components/auth/auth-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell
      title="Reset password"
      subtitle="Choose a new password for your LifeFlow account."
    >
      {token ? (
        <ResetPasswordForm action={resetPasswordAction} token={token} />
      ) : (
        <p className="text-sm text-red-600 dark:text-red-400">
          Reset token is missing. Request a new link from Forgot password.
        </p>
      )}
    </AuthShell>
  );
}

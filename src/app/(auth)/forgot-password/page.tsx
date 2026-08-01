import { forgotPasswordAction } from "@/actions/auth";
import { AuthShell, ForgotPasswordForm } from "@/components/auth/auth-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll generate a secure reset link for your account."
    >
      <ForgotPasswordForm action={forgotPasswordAction} />
    </AuthShell>
  );
}

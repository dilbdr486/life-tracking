import { loginAction } from "@/actions/auth";
import { AuthShell, LoginForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue managing your time and money."
    >
      <LoginForm action={loginAction} />
    </AuthShell>
  );
}

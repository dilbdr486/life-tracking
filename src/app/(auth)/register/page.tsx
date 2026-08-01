import { registerAction } from "@/actions/auth";
import { AuthShell, RegisterForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up LifeFlow in under a minute."
    >
      <RegisterForm action={registerAction} />
    </AuthShell>
  );
}

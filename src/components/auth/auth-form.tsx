"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ActionState } from "@/actions/auth";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { ThemeToggle } from "@/components/theme-toggle";
import { useActionToast } from "@/hooks/use-action-toast";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-sky-400/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="font-display text-2xl font-semibold">
            Life<span className="text-(--accent)">Flow</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="rounded-3xl border border-(--border) bg-(--surface)/90 p-6 shadow-(--shadow) backdrop-blur">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-1 text-sm text-(--muted)">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function LoginForm({
  action,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  useActionToast(state, pending);

  return (
    <form action={formAction} className="space-y-3">
      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        required
      />
      <PasswordInput
        name="password"
        label="Password"
        placeholder="••••••••"
        required
      />
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm text-(--accent) hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <FormMessage error={state.error} success={state.success} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
      <p className="text-center text-sm text-(--muted)">
        No account?{" "}
        <Link href="/register" className="text-(--accent) hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({
  action,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  useActionToast(state, pending);

  return (
    <form action={formAction} className="space-y-3">
      <Input name="name" label="Full name" placeholder="Alex Rivera" required />
      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        required
      />
      <PasswordInput
        name="password"
        label="Password"
        placeholder="At least 6 characters"
        required
      />
      <FormMessage error={state.error} success={state.success} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating..." : "Create account"}
      </Button>
      <p className="text-center text-sm text-(--muted)">
        Already have an account?{" "}
        <Link href="/login" className="text-(--accent) hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm({
  action,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  useActionToast(state, pending);

  return (
    <form action={formAction} className="space-y-3">
      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        required
      />
      <FormMessage error={state.error} success={state.success} />
      {state.resetLink ? (
        <div className="rounded-xl bg-(--surface-2) p-3 text-sm">
          <p className="mb-1 font-medium">Demo reset link</p>
          <Link
            href={state.resetLink}
            className="break-all text-(--accent) hover:underline"
          >
            {state.resetLink}
          </Link>
        </div>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending..." : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-(--muted)">
        <Link href="/login" className="text-(--accent) hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({
  action,
  token,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  token: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  useActionToast(state, pending);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <PasswordInput
        name="password"
        label="New password"
        placeholder="At least 6 characters"
        required
      />
      <FormMessage error={state.error} success={state.success} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Updating..." : "Reset password"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState, useRef, useState } from "react";
import { changePassword, updateProfile } from "@/actions/profile";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useActionToast } from "@/hooks/use-action-toast";

type ConfirmKind = "profile" | "password" | null;

export function ProfileForms({ name, email }: { name: string; email: string }) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfile,
    {},
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changePassword,
    {},
  );
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const profileFormRef = useRef<HTMLFormElement>(null);
  const passwordFormRef = useRef<HTMLFormElement>(null);
  const skipConfirm = useRef(false);

  useActionToast(profileState, profilePending);
  useActionToast(passwordState, passwordPending);

  function handleSubmit(
    kind: "profile" | "password",
    event: React.FormEvent<HTMLFormElement>,
  ) {
    if (skipConfirm.current) return;
    event.preventDefault();
    setConfirm(kind);
  }

  function handleConfirm() {
    if (!confirm) return;
    skipConfirm.current = true;
    const form =
      confirm === "profile" ? profileFormRef.current : passwordFormRef.current;
    setConfirm(null);
    form?.requestSubmit();
    skipConfirm.current = false;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader
          title="Profile details"
          description="Update your name and email"
        />
        <form
          ref={profileFormRef}
          action={profileAction}
          className="space-y-3"
          onSubmit={(event) => handleSubmit("profile", event)}
        >
          <Input name="name" label="Name" defaultValue={name} required />
          <Input
            name="email"
            type="email"
            label="Email"
            defaultValue={email}
            required
          />
          <FormMessage error={profileState.error} />
          <Button type="submit" disabled={profilePending}>
            {profilePending ? "Saving..." : "Save profile"}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader
          title="Change password"
          description="Keep your account secure"
        />
        <form
          ref={passwordFormRef}
          action={passwordAction}
          className="space-y-3"
          onSubmit={(event) => handleSubmit("password", event)}
        >
          <PasswordInput
            name="currentPassword"
            label="Current password"
            required
          />
          <PasswordInput name="newPassword" label="New password" required />
          <FormMessage error={passwordState.error} />
          <Button type="submit" disabled={passwordPending}>
            {passwordPending ? "Updating..." : "Update password"}
          </Button>
        </form>
      </Card>

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm === "password" ? "Update password?" : "Save profile changes?"
        }
        description={
          confirm === "password"
            ? "Change your account password with the new value you entered?"
            : "Update your profile details with the changes you made?"
        }
        confirmLabel={
          confirm === "password" ? "Update password" : "Save profile"
        }
        pending={confirm === "password" ? passwordPending : profilePending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { changePassword, updateProfile } from "@/actions/profile";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ProfileForms({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfile,
    {},
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changePassword,
    {},
  );

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader
          title="Profile details"
          description="Update your name and email"
        />
        <form action={profileAction} className="space-y-3">
          <Input name="name" label="Name" defaultValue={name} required />
          <Input
            name="email"
            type="email"
            label="Email"
            defaultValue={email}
            required
          />
          <FormMessage
            error={profileState.error}
            success={profileState.success}
          />
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
        <form action={passwordAction} className="space-y-3">
          <Input
            name="currentPassword"
            type="password"
            label="Current password"
            required
          />
          <Input
            name="newPassword"
            type="password"
            label="New password"
            required
          />
          <FormMessage
            error={passwordState.error}
            success={passwordState.success}
          />
          <Button type="submit" disabled={passwordPending}>
            {passwordPending ? "Updating..." : "Update password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

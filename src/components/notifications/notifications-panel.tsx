"use client";

import { useTransition } from "react";
import {
  createDailyReminders,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string | Date;
};

export function NotificationsPanel({
  notifications,
}: {
  notifications: Notification[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader
        title="Notification center"
        description="Reminders, budget warnings, and goal alerts"
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await createDailyReminders();
                })
              }
            >
              Generate reminders
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await markAllNotificationsRead();
                })
              }
            >
              Mark all read
            </Button>
          </div>
        }
      />

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-(--border) px-4 py-10 text-center text-sm text-(--muted)">
            No notifications yet. Generate reminders to stay on track.
          </p>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border px-4 py-3 ${
                item.read
                  ? "border-(--border) bg-transparent"
                  : "border-(--accent)/30 bg-(--accent)/5"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    <span className="rounded-full bg-(--surface-2) px-2 py-0.5 text-[11px] uppercase tracking-wide text-(--muted)">
                      {item.type}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-(--muted)">{item.message}</p>
                  <p className="mt-2 text-xs text-(--muted-2)">
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {!item.read ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      startTransition(async () => {
                        await markNotificationRead(item.id);
                      })
                    }
                  >
                    Mark read
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import {
  createActivity,
  deleteActivity,
  updateActivity,
} from "@/actions/activities";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ACTIVITY_CATEGORIES } from "@/lib/constants";
import { formatHours, toDateInputValue } from "@/lib/utils";
import {
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Pencil, Trash2 } from "lucide-react";

type Activity = {
  id: string;
  title: string;
  category: string;
  date: string | Date;
  startTime: string;
  endTime: string;
  duration: number;
  notes: string | null;
};

export function ActivityManager({ activities }: { activities: Activity[] }) {
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("daily");
  const [editing, setEditing] = useState<Activity | null>(null);
  const [createState, createAction, createPending] = useActionState(
    createActivity,
    {},
  );
  const updateBound = updateActivity.bind(null, editing?.id ?? "");
  const [updateState, updateAction, updatePending] = useActionState(
    updateBound,
    {},
  );
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const now = new Date();
    return activities.filter((item) => {
      const date = new Date(item.date);
      if (view === "daily") return isSameDay(date, now);
      if (view === "weekly") {
        return isWithinInterval(date, {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        });
      }
      return isWithinInterval(date, {
        start: startOfMonth(now),
        end: endOfMonth(now),
      });
    });
  }, [activities, view]);

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader
          title={editing ? "Edit activity" : "Add activity"}
          description="Duration is calculated automatically"
        />
        <form
          action={editing ? updateAction : createAction}
          className="space-y-3"
          key={editing?.id ?? "new"}
        >
          <Input
            name="title"
            label="Activity name"
            placeholder="Deep work session"
            defaultValue={editing?.title}
            required
          />
          <Select
            name="category"
            label="Category"
            options={ACTIVITY_CATEGORIES}
            defaultValue={editing?.category ?? "Work"}
          />
          <Input
            name="date"
            type="date"
            label="Date"
            defaultValue={
              editing
                ? toDateInputValue(editing.date)
                : toDateInputValue(new Date())
            }
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="startTime"
              type="time"
              label="Start"
              defaultValue={editing?.startTime ?? "09:00"}
              required
            />
            <Input
              name="endTime"
              type="time"
              label="End"
              defaultValue={editing?.endTime ?? "10:00"}
              required
            />
          </div>
          <Textarea
            name="notes"
            label="Notes"
            placeholder="Optional notes"
            defaultValue={editing?.notes ?? ""}
          />
          <FormMessage
            error={editing ? updateState.error : createState.error}
            success={editing ? updateState.success : createState.success}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={createPending || updatePending}>
              {editing ? "Save changes" : "Add activity"}
            </Button>
            {editing ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader
          title="Your activities"
          description="Switch between daily, weekly, and monthly views"
          action={
            <div className="flex rounded-xl border border-(--border) p-1">
              {(["daily", "weekly", "monthly"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setView(item)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
                    view === item
                      ? "bg-(--accent) text-white"
                      : "text-(--muted)"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          }
        />

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-(--border) px-4 py-10 text-center text-sm text-(--muted)">
              No activities in this view yet.
            </p>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-(--border) bg-(--surface-2)/50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    <span className="rounded-full bg-(--accent)/10 px-2 py-0.5 text-xs text-(--accent)">
                      {item.category}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-(--muted)">
                    {format(new Date(item.date), "MMM d, yyyy")} ·{" "}
                    {item.startTime}–{item.endTime} ·{" "}
                    {formatHours(item.duration)}
                  </p>
                  {item.notes ? (
                    <p className="mt-1 text-sm text-(--muted-2)">
                      {item.notes}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditing(item)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteActivity(item.id);
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

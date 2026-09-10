"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  createActivity,
  deleteActivity,
  updateActivity,
} from "@/actions/activities";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useActionToast } from "@/hooks/use-action-toast";
import { usePagination } from "@/hooks/use-pagination";
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

type ConfirmState =
  | { type: "create" }
  | { type: "update" }
  | { type: "delete"; activity: Activity }
  | null;

export function ActivityManager({ activities }: { activities: Activity[] }) {
  const toast = useToast();
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("daily");
  const [editing, setEditing] = useState<Activity | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const skipConfirm = useRef(false);
  const wasUpdatePending = useRef(false);
  const [createState, createAction, createPending] = useActionState(
    createActivity,
    {},
  );
  const updateBound = updateActivity.bind(null, editing?.id ?? "");
  const [updateState, updateAction, updatePending] = useActionState(
    updateBound,
    {},
  );
  const [deletePending, startDeleteTransition] = useTransition();

  useActionToast(createState, createPending);
  useActionToast(updateState, updatePending);

  useEffect(() => {
    if (wasUpdatePending.current && !updatePending && updateState.success) {
      setEditing(null);
    }
    wasUpdatePending.current = updatePending;
  }, [updatePending, updateState.success]);

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

  const { page, setPage, pageCount, pageItems, pageSize, total } =
    usePagination(filtered, 5, `${view}-${filtered.length}`);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (skipConfirm.current) return;
    event.preventDefault();
    setConfirm({ type: editing ? "update" : "create" });
  }

  function handleConfirm() {
    if (!confirm) return;

    if (confirm.type === "create" || confirm.type === "update") {
      skipConfirm.current = true;
      setConfirm(null);
      formRef.current?.requestSubmit();
      skipConfirm.current = false;
      return;
    }

    const id = confirm.activity.id;
    startDeleteTransition(async () => {
      const result = await deleteActivity(id);
      setConfirm(null);
      if (result.error) toast.error(result.error);
      else toast.success(result.success ?? "Activity deleted");
    });
  }

  const confirmCopy =
    confirm?.type === "delete"
      ? {
          title: "Delete activity?",
          description: `This will permanently delete “${confirm.activity.title}”. This action cannot be undone.`,
          confirmLabel: "Delete",
          variant: "danger" as const,
          pending: deletePending,
        }
      : confirm?.type === "update"
        ? {
            title: "Save activity changes?",
            description: `Update “${editing?.title ?? "this activity"}” with the changes you made?`,
            confirmLabel: "Save changes",
            variant: "primary" as const,
            pending: updatePending,
          }
        : {
            title: "Add activity?",
            description: "Create this activity with the details you entered?",
            confirmLabel: "Add activity",
            variant: "primary" as const,
            pending: createPending,
          };

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader
          title={editing ? "Edit activity" : "Add activity"}
          description="Duration is calculated automatically"
        />
        <form
          ref={formRef}
          action={editing ? updateAction : createAction}
          className="space-y-3"
          key={editing?.id ?? "new"}
          onSubmit={handleSubmit}
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
          <div className="flex gap-2">
            <Button type="submit" disabled={createPending || updatePending}>
              {editing
                ? updatePending
                  ? "Saving..."
                  : "Save changes"
                : createPending
                  ? "Adding..."
                  : "Add activity"}
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
            pageItems.map((item) => (
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
                      setConfirm({ type: "delete", activity: item })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </Card>

      <ConfirmDialog
        open={confirm !== null}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        variant={confirmCopy.variant}
        pending={confirmCopy.pending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error";

type ToastItem = {
  id: string;
  title: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: {
    success: (title: string) => void;
    error: (title: string) => void;
  };
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback((tone: ToastTone, title: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems((current) => [...current, { id, title, tone }].slice(-4));
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: {
        success: (title) => push("success", title),
        error: (title) => push("error", title),
      },
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-100 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end">
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), 3500);
    return () => window.clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg animate-rise sm:w-96",
        item.tone === "success"
          ? "border-teal-500/30 bg-(--surface) text-foreground"
          : "border-red-500/30 bg-(--surface) text-foreground",
      )}
    >
      {item.tone === "success" ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
      ) : (
        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
      )}
      <p className="flex-1 text-sm font-medium">{item.title}</p>
      <button
        type="button"
        aria-label="Dismiss"
        className="rounded-lg p-1 text-(--muted) transition hover:bg-(--surface-2) hover:text-foreground"
        onClick={() => onDismiss(item.id)}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context.toast;
}

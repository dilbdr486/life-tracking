import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-11 px-4 text-sm",
        size === "lg" && "h-12 px-5 text-base",
        variant === "primary" &&
          "bg-(--accent) text-white hover:bg-(--accent-hover) shadow-sm",
        variant === "secondary" &&
          "border border-(--border) bg-(--surface) text-foreground hover:bg-(--surface-2)",
        variant === "ghost" &&
          "text-(--muted) hover:bg-(--surface-2) hover:text-foreground",
        variant === "danger" &&
          "bg-red-600 text-white hover:bg-red-700",
        className,
      )}
      {...props}
    />
  );
}

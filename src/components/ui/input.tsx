import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ className, label, id, ...props }: Props) {
  return (
    <label className="block space-y-1.5" htmlFor={id}>
      {label ? (
        <span className="text-sm font-medium text-(--muted)">{label}</span>
      ) : null}
      <input
        id={id}
        className={cn(
          "h-11 w-full rounded-xl border border-(--border) bg-(--surface) px-3 text-sm text-foreground outline-none transition placeholder:text-(--muted-2) focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20",
          className,
        )}
        {...props}
      />
    </label>
  );
}

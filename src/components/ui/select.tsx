import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: readonly string[] | string[];
};

export function Select({ className, label, id, options, ...props }: Props) {
  return (
    <label className="block space-y-1.5" htmlFor={id}>
      {label ? (
        <span className="text-sm font-medium text-(--muted)">{label}</span>
      ) : null}
      <select
        id={id}
        className={cn(
          "h-11 w-full rounded-xl border border-(--border) bg-(--surface) px-3 text-sm text-foreground outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20",
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

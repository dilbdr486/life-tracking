import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export function Textarea({ className, label, id, ...props }: Props) {
  return (
    <label className="block space-y-1.5" htmlFor={id}>
      {label ? (
        <span className="text-sm font-medium text-(--muted)">{label}</span>
      ) : null}
      <textarea
        id={id}
        className={cn(
          "min-h-24 w-full rounded-xl border border-(--border) bg-(--surface) px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-(--muted-2) focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20",
          className,
        )}
        {...props}
      />
    </label>
  );
}

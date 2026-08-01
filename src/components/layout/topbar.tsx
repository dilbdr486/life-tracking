import { ThemeToggle } from "@/components/theme-toggle";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Topbar({
  title,
  subtitle,
  userName,
}: {
  title: string;
  subtitle?: string;
  userName?: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-(--border) bg-background/80 px-4 py-4 backdrop-blur md:px-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-(--muted)">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {userName ? (
          <span className="hidden text-sm text-(--muted) sm:inline">
            {userName}
          </span>
        ) : null}
        <ThemeToggle />
        <form action={logoutAction}>
          <Button type="submit" variant="secondary" size="sm">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </form>
      </div>
    </header>
  );
}

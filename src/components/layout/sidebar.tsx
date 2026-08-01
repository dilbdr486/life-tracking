"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  ChartPie,
  LayoutDashboard,
  Receipt,
  Settings2,
  UserRound,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activities", label: "Activities", icon: Activity },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/reports", label: "Reports", icon: ChartPie },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function Sidebar({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-(--border) bg-(--surface)/80 backdrop-blur">
      <div className="border-b border-(--border) px-5 py-5">
        <Link href="/dashboard" className="group block">
          <p className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Life<span className="text-(--accent)">Flow</span>
          </p>
          <p className="mt-1 text-xs text-(--muted)">
            Time & money, in sync
          </p>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-(--accent)/12 text-(--accent)"
                  : "text-(--muted) hover:bg-(--surface-2) hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{label}</span>
              {href === "/notifications" && unread > 0 ? (
                <span className="rounded-full bg-(--accent) px-2 py-0.5 text-[10px] font-semibold text-white">
                  {unread}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}

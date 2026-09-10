"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ChartPie,
  LayoutDashboard,
  Receipt,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/activities", label: "Time", icon: Activity },
  { href: "/expenses", label: "Money", icon: Receipt },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/reports", label: "Reports", icon: ChartPie },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-(--border) bg-(--surface)/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5 gap-1 px-2 py-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium",
                  active ? "text-(--accent)" : "text-(--muted)",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

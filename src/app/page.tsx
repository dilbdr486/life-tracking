import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { Activity, ChartPie, Wallet } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-6">
        <p className="font-display text-2xl font-semibold tracking-tight">
          Life<span className="text-(--accent)">Flow</span>
        </p>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session?.user ? (
            <Link href="/dashboard">
              <Button>Open dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="secondary">Sign in</Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button>Get started</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid min-h-[calc(100vh-88px)] max-w-6xl items-center gap-10 px-4 pb-16 pt-6 md:grid-cols-[1.05fr_0.95fr] md:px-6">
          <div className="animate-rise">
            <p className="font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Life<span className="text-(--accent)">Flow</span>
            </p>
            <h1 className="mt-4 max-w-xl text-2xl font-medium leading-snug text-foreground sm:text-3xl">
              Your time and money, managed in one calm flow.
            </h1>
            <p className="mt-4 max-w-lg text-base text-(--muted)">
              Track activities, control spending, set budgets, and read clear
              reports — built serverless for free Vercel deployment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={session?.user ? "/dashboard" : "/register"}>
                <Button size="lg">
                  {session?.user ? "Go to dashboard" : "Start free"}
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary">
                  I already have an account
                </Button>
              </Link>
            </div>
          </div>

          <div className="animate-rise stagger-2 relative overflow-hidden rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow)">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.18),transparent_45%)]" />
            <div className="relative space-y-4">
              <Feature
                icon={<Activity className="h-5 w-5" />}
                title="Activity tracker"
                text="Daily, weekly, and monthly views with auto duration."
              />
              <Feature
                icon={<Wallet className="h-5 w-5" />}
                title="Expense & budget"
                text="Category budgets, savings goals, and limit warnings."
              />
              <Feature
                icon={<ChartPie className="h-5 w-5" />}
                title="Reports & charts"
                text="Pie, bar, and line charts for time and money insight."
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-(--border) bg-background/70 p-4">
      <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-(--accent)/12 text-(--accent)">
        {icon}
      </div>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-(--muted)">{text}</p>
    </div>
  );
}

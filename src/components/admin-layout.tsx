import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  ArrowLeft,
  BarChart3,
  Users,
  Ticket,
  Megaphone,
  ListChecks,
  Layers,
  BookOpen,
  Settings,
  FileClock,
  TrendingUp,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin/overview", label: "Overview", icon: BarChart3 },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/ledger", label: "Ledger", icon: BookOpen },
  { to: "/admin/codes", label: "Codes", icon: Ticket },
  { to: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/admin/tasks", label: "Tasks", icon: ListChecks },
  { to: "/admin/rewards", label: "Rewards", icon: Coins },
  { to: "/admin/staking", label: "Staking", icon: Layers },
  { to: "/admin/economy", label: "Economy", icon: Settings },
  { to: "/admin/invest", label: "Invest", icon: TrendingUp },
  { to: "/admin/audit", label: "Audit", icon: FileClock },
] as const;

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card lg:block">
        <div className="px-5 py-5">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Back to app
          </Link>
          <div className="mt-4 font-display text-lg font-bold">Command Center</div>
        </div>
        <nav className="px-3 pb-6 space-y-1">
          {items.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:px-8">
          <div className="font-display font-semibold">BIXVEST Command Center</div>
          <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
            Exit
          </Link>
        </header>
        <div className="lg:hidden border-b border-border bg-card overflow-x-auto">
          <div className="flex gap-1 px-2 py-2">
            {items.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

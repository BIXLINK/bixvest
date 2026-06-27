import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import {
  LayoutDashboard, Sparkles, Vault, Wallet, Users, User as UserIcon,
  LogOut, Shield, Menu, X, Bell, Sun, Moon, TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useIsAdmin } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/daily", label: "Daily", icon: Sun },
  { to: "/rewards", label: "Rewards", icon: Sparkles },
  { to: "/vault", label: "Vault", icon: Vault },
  { to: "/invest", label: "Invest", icon: TrendingUp },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/referrals", label: "Referrals", icon: Users },
  { to: "/profile", label: "Profile", icon: UserIcon },
] as const;

const mobileNav = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/daily", label: "Daily", icon: Sun },
  { to: "/rewards", label: "Earn", icon: Sparkles },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "Me", icon: UserIcon },
] as const;

function formatVst(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { data: profile } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const router = useRouter();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();


  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  const SidebarInner = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-6 py-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-emerald shadow-glow" />
          <div>
            <div className="font-display text-lg font-bold tracking-tight">BIXVEST</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">Holdings</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {navItems.map(item => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            to="/admin/overview"
            onClick={() => setOpen(false)}
            className={cn(
              "mt-3 flex items-center gap-3 rounded-lg border border-sidebar-border/50 px-3 py-2.5 text-sm font-medium",
              pathname.startsWith("/admin")
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
            )}
          >
            <Shield className="h-4 w-4" /> Command Center
          </Link>
        )}
      </nav>
      <div className="border-t border-sidebar-border/50 p-4">
        <div className="mb-3 rounded-lg bg-sidebar-accent/40 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">VST Balance</div>
              <div className="font-display text-lg font-semibold">{formatVst(Number(profile?.vst_balance ?? 0))}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">BIX</div>
              <div className="font-display text-base font-semibold">{Number((profile as any)?.bix_score ?? 0)}</div>
            </div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">{SidebarInner}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-sidebar-border">{SidebarInner}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="lg:hidden font-display font-bold">BIXVEST</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs font-medium">{formatVst(Number(profile?.vst_balance ?? 0))} VST</span>
            </div>
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
          </div>
        </header>

        <main key={pathname} className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-8 page-enter">{children}</main>


        <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur lg:hidden">
          {mobileNav.map(item => {
            const active = pathname === item.to;
            return (
              <Link key={item.to} to={item.to}
                className={cn("flex flex-col items-center gap-1 py-2.5 text-[10px]",
                  active ? "text-primary" : "text-muted-foreground")}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

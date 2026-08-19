import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Activity,
  BarChart3,
  FileBarChart,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Stethoscope,
  Upload,
  UserCircle,
  Users,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth, ROLE_LABELS, type AppRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

type NavItem = { to: string; label: string; icon: LucideIcon };

const NAV_BY_ROLE: Record<AppRole, NavItem[]> = {
  athlete: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/my-profile", label: "My Profile", icon: UserCircle },
    { to: "/my-injuries", label: "My Injury History", icon: HeartPulse },
    { to: "/upload", label: "Upload Video", icon: Upload },
    { to: "/analysis", label: "Analysis Results", icon: BarChart3 },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
  coach: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/athletes", label: "Athlete List", icon: Users },
    { to: "/athletes/new", label: "Add Athlete", icon: UserCircle },
    { to: "/reports", label: "Reports", icon: FileBarChart },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
  physiotherapist: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/athletes", label: "Athlete List", icon: Users },
    { to: "/injuries", label: "Injury Management", icon: Stethoscope },
    { to: "/reports", label: "Reports", icon: FileBarChart },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
  sports_scientist: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/athletes", label: "Athlete List", icon: Users },
    { to: "/video-analysis", label: "Video Analysis", icon: Video },
    { to: "/reports", label: "Reports", icon: FileBarChart },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
  administrator: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/users", label: "Users", icon: ShieldCheck },
    { to: "/athletes", label: "Athlete List", icon: Users },
    { to: "/reports", label: "Reports", icon: FileBarChart },
    { to: "/system", label: "System Settings", icon: Settings },
  ],
};

function AuthenticatedLayout() {
  const { session, loading, rolesLoading, user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session || rolesLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const primaryRole: AppRole | undefined = roles[0];
  const nav = primaryRole ? NAV_BY_ROLE[primaryRole] : [];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6 font-display text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-gradient-primary text-primary-foreground">
            <Activity className="h-4 w-4" />
          </span>
          KinetIQ
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => {
            const active = path === n.to || (n.to !== "/dashboard" && path.startsWith(n.to + "/"));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <div className="mb-3 text-xs text-muted-foreground">
            <div className="truncate font-medium text-foreground">{user?.email}</div>
            <div className="mt-0.5">{primaryRole ? ROLE_LABELS[primaryRole] : "No role assigned"}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
          >
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="md:hidden flex h-14 items-center justify-between border-b border-border px-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-display font-bold">
            <Activity className="h-4 w-4 text-primary" /> KinetIQ
          </Link>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

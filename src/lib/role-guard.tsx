import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function RoleGate({
  allow,
  children,
}: {
  allow: AppRole[];
  children: ReactNode;
}) {
  const { roles, loading, rolesLoading } = useAuth();
  if (loading || rolesLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  const ok = roles.some((r) => allow.includes(r));
  if (!ok) return <AccessDenied />;
  return <>{children}</>;
}

export function AccessDenied() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/15 text-destructive">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold">Access denied</h1>
      <p className="mt-2 text-muted-foreground">
        You do not have permission to view this page. If you believe this is a mistake, contact your administrator.
      </p>
      <Button asChild className="mt-6">
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}

export function hasAnyRole(roles: AppRole[], allow: AppRole[]) {
  return roles.some((r) => allow.includes(r));
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { RoleGate } from "@/lib/role-guard";
import { ROLE_LABELS, type AppRole } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
  head: () => ({ meta: [{ title: "Users — KinetIQ" }] }),
});

function UsersPage() {
  return (
    <RoleGate allow={["administrator"]}>
      <UsersList />
    </RoleGate>
  );
}

function UsersList() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      const roleMap = new Map<string, AppRole[]>();
      (rolesRes.data ?? []).forEach((r) => {
        const list = roleMap.get(r.user_id) ?? [];
        list.push(r.role as AppRole);
        roleMap.set(r.user_id, list);
      });
      return (profilesRes.data ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] }));
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">All registered users and their assigned roles.</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card shadow-card">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (data ?? []).length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No users registered yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {data!.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div>
                  <div className="font-medium">{u.full_name || "Unnamed user"}</div>
                  <div className="text-xs text-muted-foreground">
                    Joined {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {u.roles.length === 0 ? (
                    <Badge variant="outline">No role</Badge>
                  ) : u.roles.map((r) => (
                    <Badge key={r} className="border-0 bg-primary/15 text-primary">{ROLE_LABELS[r]}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

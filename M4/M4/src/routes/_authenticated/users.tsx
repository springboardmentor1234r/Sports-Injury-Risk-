import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleGate } from "@/lib/role-guard";
import { ROLE_LABELS, useAuth, type AppRole } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
  head: () => ({
    meta: [
      { title: "User Management — KinetIQ" },
      { name: "description", content: "Administrator console for managing accounts and roles." },
    ],
  }),
});

const ALL_ROLES: AppRole[] = [
  "athlete",
  "coach",
  "physiotherapist",
  "sports_scientist",
  "administrator",
];

function UsersPage() {
  return (
    <RoleGate allow={["administrator"]}>
      <UsersList />
    </RoleGate>
  );
}

function UsersList() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, staff_code, created_at"),
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
      return (profilesRes.data ?? [])
        .map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] }))
        .sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));
    },
  });

  const changeRole = async (userId: string, role: AppRole) => {
    const del = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (del.error) return toast.error(del.error.message);
    const ins = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (ins.error) return toast.error(ins.error.message);
    toast.success(`Role updated to ${ROLE_LABELS[role]}`);
    await qc.invalidateQueries({ queryKey: ["admin-users"] });
    await qc.invalidateQueries({ queryKey: ["staff-directory"] });
  };

  const rows = (data ?? []).filter((u) => {
    if (filter !== "all" && !u.roles.includes(filter as AppRole)) return false;
    if (!q) return true;
    return [u.full_name, u.staff_code]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q.toLowerCase());
  });

  const counts = ALL_ROLES.map((r) => ({
    role: r,
    n: (data ?? []).filter((u) => u.roles.includes(r)).length,
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">User management</h1>
          <p className="text-muted-foreground">
            Every account in the organisation, with its unique staff ID and assigned role.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {counts.map((c) => (
          <div key={c.role} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {ROLE_LABELS[c.role]}
            </div>
            <div className="mt-1 font-display text-2xl font-bold">{c.n}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Input
          placeholder="Search by name or staff ID"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[220px] flex-1"
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[190px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ALL_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card shadow-card">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No users match your filters.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              >
                <div>
                  <div className="font-medium">
                    {u.full_name || "Unnamed user"}
                    {u.id === user?.id && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ID {u.staff_code ?? "—"} · joined {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {u.roles.length === 0 && <Badge variant="outline">No role</Badge>}
                  <Select
                    value={u.roles[0] ?? ""}
                    onValueChange={(v) => changeRole(u.id, v as AppRole)}
                  >
                    <SelectTrigger className="w-[190px]">
                      <SelectValue placeholder="Assign role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

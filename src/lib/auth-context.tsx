import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "athlete"
  | "coach"
  | "physiotherapist"
  | "sports_scientist"
  | "administrator";

const ROLE_KEYS: AppRole[] = ["athlete", "coach", "physiotherapist", "sports_scientist", "administrator"];

type AuthState = {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  rolesLoading: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);

  const loadRoles = async (userId: string | undefined, metaRole?: string) => {
    if (!userId) {
      setRoles([]);
      setRolesLoading(false);
      return;
    }
    setRolesLoading(true);
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error) {
      console.error("[auth] failed to load user roles:", error.message);
    }
    const fetched = (data ?? []).map((r) => r.role as AppRole);
    if (fetched.length > 0) {
      setRoles(fetched);
    } else if (metaRole && ROLE_KEYS.includes(metaRole as AppRole)) {
      // Fallback to the role set at signup (stored in user_metadata).
      // Keeps the UI usable if the user_roles row isn't readable for any reason.
      console.warn("[auth] user_roles empty for user; falling back to metadata role:", metaRole);
      setRoles([metaRole as AppRole]);
    } else {
      setRoles([]);
    }
    setRolesLoading(false);
  };


  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_OUT") {
        setRoles([]);
        setRolesLoading(false);
        return;
      }
      const metaRole = (s?.user?.user_metadata as { role?: string } | undefined)?.role;
      setTimeout(() => { void loadRoles(s?.user?.id, metaRole); }, 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      const metaRole = (data.session?.user?.user_metadata as { role?: string } | undefined)?.role;
      void loadRoles(data.session?.user?.id, metaRole).finally(() => setLoading(false));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    roles,
    loading,
    rolesLoading,
    signOut: async () => { await supabase.auth.signOut(); },
    refreshRoles: async () => { await loadRoles(session?.user?.id); },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  athlete: "Athlete",
  coach: "Coach",
  physiotherapist: "Physiotherapist",
  sports_scientist: "Sports Scientist",
  administrator: "Administrator",
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/auth-context";

export type StaffMember = {
  id: string;
  full_name: string | null;
  role: AppRole;
  staff_code: string | null;
};

/** Organisation-wide directory of coaches, physios, scientists and admins. */
export function useStaffDirectory(role?: AppRole) {
  return useQuery({
    queryKey: ["staff-directory"],
    queryFn: async (): Promise<StaffMember[]> => {
      const { data, error } = await supabase.rpc("staff_directory");
      if (error) throw error;
      return (data ?? []) as StaffMember[];
    },
    select: (rows) => (role ? rows.filter((r) => r.role === role) : rows),
    staleTime: 60_000,
  });
}

export function staffLabel(m: StaffMember) {
  return `${m.full_name || "Unnamed"} · ${m.staff_code ?? "—"}`;
}

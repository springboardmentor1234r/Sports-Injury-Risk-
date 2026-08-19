import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { RoleGate } from "@/lib/role-guard";
import { EmptyPage } from "@/components/empty-page";

export const Route = createFileRoute("/_authenticated/system")({
  component: () => (
    <RoleGate allow={["administrator"]}>
      <EmptyPage
        icon={Settings}
        title="System settings"
        description="Configure organisation-wide preferences, integrations and data retention policies."
        note="No system-level configuration is required at this time."
      />
    </RoleGate>
  ),
  head: () => ({ meta: [{ title: "System Settings — KinetIQ" }] }),
});

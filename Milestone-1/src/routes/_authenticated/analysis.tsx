import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { RoleGate } from "@/lib/role-guard";
import { EmptyPage } from "@/components/empty-page";

export const Route = createFileRoute("/_authenticated/analysis")({
  component: AnalysisPage,
  head: () => ({ meta: [{ title: "Analysis Results — KinetIQ" }] }),
});

function AnalysisPage() {
  return (
    <RoleGate allow={["athlete"]}>
      <EmptyPage
        icon={BarChart3}
        title="Analysis results"
        description="Movement quality scores and biomechanical breakdowns from your submitted videos."
        note="Pose estimation and biomechanical analysis ship in Milestone 2 — this page is a placeholder for now."
      />
    </RoleGate>
  );
}

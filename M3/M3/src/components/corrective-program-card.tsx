import { Activity, Dumbbell, HeartPulse, Move, Sliders } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  buildCorrectiveProgram,
  totalItemCount,
  type CorrectiveItem,
} from "@/lib/corrective-recommendations";
import type { InjuryRiskProfile } from "@/lib/injury-risk";

const TAB_META = [
  { key: "exercise" as const, label: "Exercises", icon: Activity },
  { key: "mobility" as const, label: "Mobility", icon: Move },
  { key: "strengthening" as const, label: "Strengthening", icon: Dumbbell },
  { key: "recovery" as const, label: "Recovery", icon: HeartPulse },
  { key: "training_modification" as const, label: "Training", icon: Sliders },
];

function priorityBadgeClass(priority: CorrectiveItem["priority"]): string {
  return priority === "high"
    ? "bg-destructive/15 text-destructive border-0"
    : "bg-warning/20 text-warning border-0";
}

function ItemList({ items }: { items: CorrectiveItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-background/40 px-3 py-4 text-center text-sm text-muted-foreground">
        Nothing flagged in this category right now.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-border bg-background/60 p-4">
          <div className="flex items-start justify-between gap-3">
            <span className="font-medium leading-snug">{item.title}</span>
            <Badge className={`${priorityBadgeClass(item.priority)} shrink-0 text-[10px]`}>
              {item.priority === "high" ? "High priority" : "Medium priority"}
            </Badge>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">{item.detail}</p>
          {item.prescription && (
            <p className="mt-2 text-xs font-medium text-primary">{item.prescription}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground/70">Why: {item.rationale}</p>
        </li>
      ))}
    </ul>
  );
}

export function CorrectiveProgramCard({ profile }: { profile: InjuryRiskProfile }) {
  const program = buildCorrectiveProgram(profile);
  const total = totalItemCount(program);

  const byKey: Record<(typeof TAB_META)[number]["key"], CorrectiveItem[]> = {
    exercise: program.exercises,
    mobility: program.mobility,
    strengthening: program.strengthening,
    recovery: program.recovery,
    training_modification: program.trainingModifications,
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold">Corrective program</h3>
          <p className="text-sm text-muted-foreground">
            {program.isMaintenanceOnly
              ? "No elevated risk factors — maintenance routine only."
              : `${total} recommendation${total === 1 ? "" : "s"} across exercises, mobility, strengthening, recovery and training modifications.`}
          </p>
        </div>
      </div>

      <Tabs defaultValue="exercise">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/70 p-1">
          {TAB_META.map(({ key, label, icon: Icon }) => {
            const count = byKey[key].length;
            return (
              <TabsTrigger key={key} value={key} className="gap-1.5 px-2.5 py-1.5">
                <Icon className="h-3.5 w-3.5" />
                {label}
                {count > 0 && (
                  <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 text-[10px] text-primary">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {TAB_META.map(({ key }) => (
          <TabsContent key={key} value={key} className="mt-4">
            <ItemList items={byKey[key]} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

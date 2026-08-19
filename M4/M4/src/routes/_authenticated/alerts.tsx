import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALERT_QUERY_KEY, SEVERITY_TONE, useAlerts } from "@/lib/alerts";
import { RISK_LEVEL_LABELS } from "@/lib/injury-risk";

export const Route = createFileRoute("/_authenticated/alerts")({
  component: AlertsPage,
  head: () => ({
    meta: [
      { title: "Alerts — KinetIQ" },
      { name: "description", content: "High-risk notifications raised from movement analyses." },
    ],
  }),
});

function AlertsPage() {
  const { data, isLoading, error } = useAlerts();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");

  const alerts = (data ?? []).filter((a) =>
    filter === "all" ? true : filter === "unread" ? !a.is_read : a.severity === filter,
  );

  const markRead = async (id: string, isRead: boolean) => {
    const { error } = await supabase.from("alerts").update({ is_read: isRead }).eq("id", id);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ALERT_QUERY_KEY });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("alerts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Alert dismissed");
    await qc.invalidateQueries({ queryKey: ALERT_QUERY_KEY });
  };

  const markAllRead = async () => {
    const unread = (data ?? []).filter((a) => !a.is_read).map((a) => a.id);
    if (unread.length === 0) return;
    const { error } = await supabase.from("alerts").update({ is_read: true }).in("id", unread);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ALERT_QUERY_KEY });
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Alerts</h1>
            <p className="text-muted-foreground">
              Notifications raised when an analysis crosses a high-risk threshold.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All alerts</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <Check className="h-4 w-4" /> Mark all read
          </Button>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {error ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
            Could not load alerts: {(error as Error).message}
          </div>
        ) : isLoading ? (
          <div className="h-24 animate-pulse rounded-2xl border border-border bg-card/60" />
        ) : alerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
            <BellOff className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-3 font-display text-lg font-semibold">No alerts</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Alerts appear automatically when a movement analysis flags elevated injury risk.
            </p>
          </div>
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              className={`rounded-2xl border p-5 shadow-card transition ${
                a.is_read ? "border-border bg-card/50" : "border-primary/40 bg-card"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className={SEVERITY_TONE[a.severity]}>
                      {RISK_LEVEL_LABELS[a.severity]}
                    </Badge>
                    {!a.is_read && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                        New
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-display text-base font-semibold">{a.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => markRead(a.id, !a.is_read)}>
                    <Check className="h-4 w-4" /> {a.is_read ? "Unread" : "Read"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

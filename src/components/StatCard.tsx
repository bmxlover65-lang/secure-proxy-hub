import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  trend?: { value: string; positive?: boolean };
}) {
  return (
    <Card
      className="group relative overflow-hidden border-border/60 transition-all hover:border-primary/40 hover:shadow-[var(--shadow-glow)]"
      style={{ background: "var(--gradient-card)" }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity group-hover:opacity-30"
        style={{ background: "var(--gradient-primary)" }}
      />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</div>
            {(hint || trend) && (
              <div className="mt-1.5 flex items-center gap-2 text-xs">
                {trend && (
                  <span className={`rounded-full px-1.5 py-0.5 font-medium ${
                    trend.positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                  }`}>
                    {trend.value}
                  </span>
                )}
                {hint && <span className="text-muted-foreground">{hint}</span>}
              </div>
            )}
          </div>
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            <Icon className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

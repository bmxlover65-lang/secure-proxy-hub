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
      className="group relative overflow-hidden rounded-none border-border transition-colors hover:border-primary/60"
      style={{ background: "var(--gradient-card)" }}
    >
      <span aria-hidden="true" className="absolute left-0 top-0 h-full w-[2px] bg-primary/0 transition-colors group-hover:bg-primary" />
      <CardContent className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="label-mono">{label}</div>
            <div className="font-display mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</div>
            {(hint || trend) && (
              <div className="mt-2 flex items-center gap-2 text-[11px]">
                {trend && (
                  <span className={`border px-1.5 py-0.5 font-semibold ${
                    trend.positive ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"
                  }`}>
                    {trend.value}
                  </span>
                )}
                {hint && <span className="text-muted-foreground">{hint}</span>}
              </div>
            )}
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-border bg-secondary/40 text-primary transition-colors group-hover:border-primary/60">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

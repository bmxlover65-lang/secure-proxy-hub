import type { LucideIcon, ReactNode } from "react";
import type { ComponentType } from "react";

export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border/60 p-6 md:p-8"
      style={{ background: "var(--gradient-card)" }}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--gradient-primary)" }}
      />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {Icon && (
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              <Icon className="h-6 w-6 text-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

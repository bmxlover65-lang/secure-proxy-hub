import type { ReactNode, ComponentType } from "react";

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
      className="relative overflow-hidden rounded-2xl border border-border/60 p-4 sm:p-6 md:p-8"
      style={{ background: "var(--gradient-card)" }}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--gradient-primary)" }}
      />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {Icon && (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              <Icon className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">{title}</h1>
            {description && <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 md:shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

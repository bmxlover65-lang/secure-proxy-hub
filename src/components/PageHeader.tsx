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
      className="bracket-frame relative overflow-hidden border border-border p-4 sm:p-6 md:p-7"
      style={{ background: "var(--gradient-card)" }}
    >
      <div aria-hidden="true" className="grid-lines pointer-events-none absolute inset-0 opacity-[0.35]" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary bg-primary sm:h-11 sm:w-11">
              <Icon className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-display truncate text-xl font-bold uppercase tracking-tight sm:text-2xl md:text-[27px]">
              {title}
            </h1>
            {description && <p className="mt-1.5 text-[11px] text-muted-foreground sm:text-xs">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 md:shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

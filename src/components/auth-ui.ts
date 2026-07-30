// Shared terminal-style class strings for the auth screens.
export const authPanel =
  "relative space-y-5 border border-border bg-card/70 p-6 sm:p-7 backdrop-blur-xl";

export const authLabel =
  "label-mono text-[0.65rem] text-muted-foreground";

export const authInput =
  "h-11 rounded-none border-border bg-secondary/40 pl-10 font-mono text-sm transition-colors focus-visible:border-primary focus-visible:ring-0";

export const authInputPwd = authInput + " pr-10";

export const authButton =
  "group h-11 w-full rounded-none bg-primary font-mono text-[0.7rem] uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-40";

export const authIcon =
  "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary";

export const authAlert =
  "border border-destructive/50 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive";

export const authLink =
  "font-mono text-primary underline-offset-4 transition-colors hover:underline";
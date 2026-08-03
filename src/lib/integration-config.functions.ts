import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendSupabaseAuth } from "@/lib/server-function-auth";
import { CATEGORY_META } from "@/lib/games";

const CATEGORY_ENUM = z.enum(Object.keys(CATEGORY_META) as [string, ...string[]]);

export type IntegrationConfig = {
  hyper_base: string;
  hyper_data_key: string | null;
  hyper_cb_key: string | null;
  hyper_cb_secret: string | null;
  hyper_token_ttl: number;
  enforce_config: boolean;
  allowed_categories: string[];
  updated_at: string;
};

export const REQUIRED_FIELDS = ["hyper_base", "hyper_data_key", "hyper_cb_key", "hyper_cb_secret", "hyper_token_ttl"] as const;

export const getIntegrationConfig = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("integration_config")
      .select("hyper_base, hyper_data_key, hyper_cb_key, hyper_cb_secret, hyper_token_ttl, enforce_config, allowed_categories, updated_at")
      .eq("id", "default")
      .maybeSingle();
    if (error) throw new Error(error.message);
    const cfg = (data ?? null) as IntegrationConfig | null;
    const missing = cfg
      ? REQUIRED_FIELDS.filter((f) => {
          const v = cfg[f] as unknown;
          return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
        })
      : [...REQUIRED_FIELDS];
    return {
      config: cfg,
      missing,
      ready: missing.length === 0,
      supported_categories: Object.entries(CATEGORY_META).map(([category, m]) => ({ category, games: m.games })),
    };
  });

export const updateIntegrationConfig = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      hyper_base: z.string().trim().url().max(200).optional(),
      hyper_data_key: z.string().trim().max(200).nullable().optional(),
      hyper_cb_key: z.string().trim().max(200).nullable().optional(),
      hyper_cb_secret: z.string().trim().max(300).nullable().optional(),
      hyper_token_ttl: z.number().int().min(30).max(86400).optional(),
      enforce_config: z.boolean().optional(),
      // Only real, platform-supported categories can ever be enabled.
      allowed_categories: z.array(CATEGORY_ENUM).min(1).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) if (v !== undefined) patch[k] = v;
    if (Object.keys(patch).length === 0) return { ok: true };

    // Enforcement can only be switched on when every required field is present.
    if (patch.enforce_config === true) {
      const { data: cur } = await context.supabase
        .from("integration_config")
        .select("hyper_base, hyper_data_key, hyper_cb_key, hyper_cb_secret, hyper_token_ttl")
        .eq("id", "default").maybeSingle();
      const merged = { ...(cur ?? {}), ...patch } as Record<string, unknown>;
      const missing = REQUIRED_FIELDS.filter((f) => {
        const v = merged[f];
        return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
      });
      if (missing.length > 0) throw new Error(`Cannot enable enforcement — missing: ${missing.join(", ")}`);
    }

    const { error } = await context.supabase
      .from("integration_config")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({ id: "default", ...patch } as any, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

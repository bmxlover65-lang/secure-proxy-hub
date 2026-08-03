import { CATEGORY_META } from "@/lib/games";

/** The only categories this platform can ever serve. TRX / video games are not supported. */
export const SUPPORTED_CATEGORIES = Object.keys(CATEGORY_META) as string[];

/** Callback operations that make sense for a game category (identical for all today). */
export const CATEGORY_OPS = ["GetBalance", "PlaceBet", "WinLoss"] as const;

export function isSupportedCategory(cat: string | null | undefined): boolean {
  return !!cat && SUPPORTED_CATEGORIES.includes(cat.toLowerCase());
}

/**
 * Partner app sends `gameCode` like WinGo_30S / K3_1M / D5_1M / MotoRace_1M /
 * TrxWinGo_1M. Map it to our internal { category, game }. TRX / video variants
 * are intentionally unsupported.
 */
const CODE_TO_CATEGORY: Record<string, string> = {
  wingo: "wingo",
  k3: "k3",
  d5: "d5",
  "5d": "d5",
  motorace: "motorace",
};

export function parseGameCode(
  code: string | null | undefined,
): { category: string; game: string } | null {
  if (!code) return null;
  const raw = String(code).trim().replace(/\s+/g, "");
  const m = raw.match(/^([A-Za-z0-9]+)[_-]([0-9]+[SsMm])$/);
  if (!m) return null;
  const category = CODE_TO_CATEGORY[m[1].toLowerCase()];
  if (!category) return null;
  const game = m[2].toLowerCase();
  if (!CATEGORY_META[category].games.includes(game)) return null;
  return { category, game };
}

/** Intersect: platform-supported ∩ admin-enabled ∩ this key's category. */
export function resolveAllowedGames(
  keyCategory: string | null | undefined,
  enabledCategories: string[] | null | undefined,
  ops: readonly string[] = CATEGORY_OPS,
) {
  const enabled = (enabledCategories && enabledCategories.length > 0 ? enabledCategories : SUPPORTED_CATEGORIES)
    .map((c) => c.toLowerCase())
    .filter(isSupportedCategory);
  const key = (keyCategory || "").toLowerCase();
  const cats = key && key !== "all" ? enabled.filter((c) => c === key) : enabled;
  return cats.map((category) => ({
    category,
    games: CATEGORY_META[category].games,
    operations: [...ops],
  }));
}

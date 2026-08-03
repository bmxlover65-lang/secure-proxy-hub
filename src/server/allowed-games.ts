import { CATEGORY_META } from "@/lib/games";

/** The only categories this platform can ever serve. TRX / video games are not supported. */
export const SUPPORTED_CATEGORIES = Object.keys(CATEGORY_META) as string[];

/** Callback operations that make sense for a game category (identical for all today). */
export const CATEGORY_OPS = ["GetBalance", "PlaceBet", "WinLoss"] as const;

export function isSupportedCategory(cat: string | null | undefined): boolean {
  return !!cat && SUPPORTED_CATEGORIES.includes(cat.toLowerCase());
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

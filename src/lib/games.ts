// Client-safe game catalog (shared by UI and server upstream builder).
export const CATEGORY_META: Record<
  string,
  { folder: string; prefix: string; games: string[] }
> = {
  wingo: { folder: "WinGo", prefix: "WinGo", games: ["30s", "1m", "3m", "5m"] },
  d5: { folder: "D5", prefix: "D5", games: ["1m", "3m", "5m", "10m"] },
  k3: { folder: "K3", prefix: "K3", games: ["1m", "3m", "5m", "10m"] },
  motorace: { folder: "MotoRace", prefix: "MotoRace", games: ["1m"] },
};

export const SUPPORTED_GAMES: { category: string; games: string[] }[] =
  Object.entries(CATEGORY_META).map(([category, m]) => ({
    category,
    games: m.games,
  }));

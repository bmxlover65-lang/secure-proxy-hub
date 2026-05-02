// Maps category + game to upstream draw.ar-lottery01.com URL
// Mirrors the folder layout in the user's screenshot.

const BASE = "https://draw.hgzy.click";

export type UpstreamType = "period" | "history";

// Map lowercase category -> { folder name on upstream, prefix used in file names, supported games }
const CATEGORY_META: Record<string, { folder: string; prefix: string; games: string[] }> = {
  wingo: { folder: "WinGo", prefix: "WinGo", games: ["30s", "1m", "3m", "5m"] },
  d5: { folder: "D5", prefix: "D5", games: ["1m", "3m", "5m", "10m"] },
  k3: { folder: "K3", prefix: "K3", games: ["1m", "3m", "5m", "10m"] },
  motorace: { folder: "MotoRace", prefix: "MotoRace", games: ["1m"] },
};

export const SUPPORTED_GAMES: { category: string; games: string[] }[] = Object.entries(
  CATEGORY_META,
).map(([category, m]) => ({ category, games: m.games }));

export function buildUpstreamUrl(
  category: string,
  game: string,
  type: UpstreamType = "period",
): string | null {
  const c = category.toLowerCase();
  const g = game.toLowerCase();
  const meta = CATEGORY_META[c];
  if (!meta || !meta.games.includes(g)) return null;
  const file = `${meta.prefix}_${g.toUpperCase()}`; // e.g. WinGo_30S
  const path =
    type === "history"
      ? `/${meta.folder}/${file}/GetHistoryIssuePage.json`
      : `/${meta.folder}/${file}.json`;
  return `${BASE}${path}?ts=${Date.now()}`;
}

export async function fetchUpstream(url: string): Promise<{
  status: number;
  body: string;
  ms: number;
}> {
  const start = Date.now();
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "Mozilla/5.0",
      referer: "https://hgzy.click/",
    },
  });
  const body = await res.text();
  return { status: res.status, body, ms: Date.now() - start };
}

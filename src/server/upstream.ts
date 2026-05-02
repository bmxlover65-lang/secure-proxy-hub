// Maps category + game to upstream draw.ar-lottery01.com URL
// Mirrors the folder layout in the user's screenshot.

const BASE = "https://draw.hgzy.click";

// category (lowercase) -> { game (lowercase) -> path }
const ROUTES: Record<string, Record<string, string>> = {
  wingo: {
    "30s": "/WinGo/WinGo_30S.json",
    "1m": "/WinGo/WinGo_1M.json",
    "3m": "/WinGo/WinGo_3M.json",
    "5m": "/WinGo/WinGo_5M.json",
  },
  d5: {
    "1m": "/D5/D5_1M/GetHistoryIssuePage.json",
    "3m": "/D5/D5_3M/GetHistoryIssuePage.json",
    "5m": "/D5/D5_5M/GetHistoryIssuePage.json",
    "10m": "/D5/D5_10M/GetHistoryIssuePage.json",
  },
  k3: {
    "1m": "/K3/K3_1M/GetHistoryIssuePage.json",
    "3m": "/K3/K3_3M/GetHistoryIssuePage.json",
    "5m": "/K3/K3_5M/GetHistoryIssuePage.json",
    "10m": "/K3/K3_10M/GetHistoryIssuePage.json",
  },
  motorace: {
    "1m": "/MotoRace/MotoRace_1M/GetHistoryIssuePage.json",
  },
};

export const SUPPORTED_GAMES: { category: string; games: string[] }[] = Object.entries(ROUTES).map(
  ([category, games]) => ({ category, games: Object.keys(games) }),
);

export function buildUpstreamUrl(category: string, game: string): string | null {
  const c = category.toLowerCase();
  const g = game.toLowerCase();
  const path = ROUTES[c]?.[g];
  if (!path) return null;
  const ts = Date.now();
  return `${BASE}${path}?ts=${ts}`;
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

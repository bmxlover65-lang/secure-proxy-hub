// Maps category + game to upstream draw.ar-lottery01.com URL
// Mirrors the folder layout in the user's screenshot.

import { CATEGORY_META } from "@/lib/games";

const BASE = "https://draw.ar-lottery01.com";

export type UpstreamType = "period" | "history";

export { SUPPORTED_GAMES } from "@/lib/games";

export function buildUpstreamUrl(
  category: string,
  game: string,
  type: UpstreamType = "period",
): string | null {
  const c = category.toLowerCase();
  const g = game.toLowerCase();
  const meta = CATEGORY_META[c];
  if (!meta || !meta.games.includes(g)) return null;
  const file = `${meta.prefix}_${g.toUpperCase()}`;
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

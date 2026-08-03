export function genSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const CALLBACK_SELECT =
  "id, name, api_key, status, category, expires_at, callback_url, callback_secret, callback_enabled, token_ttl_seconds";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/dashboard/docs")({ component: DocsPage });

const ENDPOINTS = [
  { cat: "wingo", games: ["1m", "3m", "5m", "10m"] },
  { cat: "k3", games: ["1m", "3m", "5m", "10m"] },
  { cat: "d5", games: ["1m", "3m", "5m", "10m"] },
  { cat: "motorace", games: ["1m"] },
];

const TYPES = [
  { type: "period", desc: "Current period info (issue number, countdown, current/previous/next)", sample: `{
  "success": true,
  "data": {
    "current": { "issueNumber": "...", "endTime": "..." },
    "previous": { "issueNumber": "...", "number": 5 },
    "next": { "issueNumber": "..." }
  }
}` },
  { type: "history", desc: "Recent results list (raw upstream JSON)", sample: `{
  "success": true,
  "data": {
    "list": [
      { "issueNumber": "...", "number": 4, "colour": "red" },
      { "issueNumber": "...", "number": 7, "colour": "green" }
    ]
  }
}` },
  { type: "sametrend", desc: "Latest result number only (plain text response)", sample: `4` },
];

const ERRORS = [
  { code: 401, msg: "Invalid API key" },
  { code: 403, msg: "Domain / IP not whitelisted" },
  { code: 404, msg: "Endpoint not found" },
  { code: 410, msg: "API key expired" },
  { code: 423, msg: "API key suspended" },
  { code: 429, msg: "Rate limit exceeded" },
  { code: 502, msg: "Upstream provider error" },
];

function DocsPage() {
  const base = "https://sass.hyperapi.in";
  return (
    <div className="space-y-6">
      <PageHeader icon={BookOpen} title="API Documentation" description="Use your API key to call Hyper Softs SaaS proxy endpoints." />

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardContent className="p-6 space-y-4">
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
            <div><strong>Pricing:</strong> 1000 coins = ₹2000 • 1 API key = 1000 coins</div>
            <div className="text-xs text-muted-foreground mt-1">Top up coins from the Wallet page. Each new API key deducts 1000 coins from your balance.</div>
          </div>

          <h3 className="text-base font-semibold">Base URL</h3>
          <pre className="rounded-md bg-secondary/40 p-3 font-mono text-xs">{base}/api/public/proxy</pre>
          <p className="text-xs text-muted-foreground">All requests must use the <code className="rounded bg-secondary/40 px-1">{base}</code> domain over HTTPS.</p>

          <h3 className="text-base font-semibold">Authentication</h3>
          <p className="text-sm text-muted-foreground">Pass your API key as the <code className="rounded bg-secondary/40 px-1">api_key</code> query parameter.</p>

          <h3 className="text-base font-semibold">Query parameters</h3>
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border/40"><th className="p-2">Param</th><th>Required</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/30"><td className="p-2 font-mono">api_key</td><td>Yes</td><td>Your HAPI_… key from the Keys page</td></tr>
              <tr className="border-b border-border/30"><td className="p-2 font-mono">category</td><td>Yes</td><td>wingo, k3, d5, motorace</td></tr>
              <tr className="border-b border-border/30"><td className="p-2 font-mono">game</td><td>Yes</td><td>1m, 3m, 5m, 10m (motorace: 1m only)</td></tr>
              <tr className="border-b border-border/30"><td className="p-2 font-mono">type</td><td>No</td><td>period (default), history, sametrend</td></tr>
            </tbody>
          </table>

          <h3 className="text-base font-semibold">Response types</h3>
          {TYPES.map((t) => (
            <div key={t.type} className="space-y-2">
              <div className="text-sm"><code className="rounded bg-secondary/40 px-1 font-mono">type={t.type}</code> — <span className="text-muted-foreground">{t.desc}</span></div>
              <pre className="overflow-x-auto rounded-md bg-secondary/40 p-3 font-mono text-xs">{`${base}/api/public/proxy?category=wingo&game=1m&api_key=HAPI_XXXX&type=${t.type}`}</pre>
              <pre className="overflow-x-auto rounded-md bg-secondary/40 p-3 font-mono text-xs">{t.sample}</pre>
            </div>
          ))}

          <h3 className="text-base font-semibold">Example request</h3>
          <pre className="overflow-x-auto rounded-md bg-secondary/40 p-3 font-mono text-xs">
{`curl "${base}/api/public/proxy?category=wingo&game=1m&api_key=HAPI_XXXX"`}
          </pre>

          <h3 className="text-base font-semibold">JavaScript example</h3>
          <pre className="overflow-x-auto rounded-md bg-secondary/40 p-3 font-mono text-xs">
{`const res = await fetch("${base}/api/public/proxy?category=wingo&game=1m&api_key=HAPI_XXXX");
const json = await res.json();
console.log(json.data);`}
          </pre>

          <h3 className="text-base font-semibold">Endpoints</h3>
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border/40"><th className="p-2">Category</th><th>Games</th><th>Full URL</th></tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((e) => (
                <tr key={e.cat} className="border-b border-border/30">
                  <td className="p-2 font-mono uppercase">{e.cat}</td>
                  <td className="font-mono text-xs">{e.games.join(", ")}</td>
                  <td className="font-mono text-[11px] text-muted-foreground">{base}/api/public/proxy?category={e.cat}&game={e.games[0]}&api_key=…</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="text-base font-semibold">Error codes</h3>
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border/40"><th className="p-2">HTTP</th><th>Meaning</th></tr>
            </thead>
            <tbody>
              {ERRORS.map((e) => (
                <tr key={e.code} className="border-b border-border/30">
                  <td className="p-2 font-mono">{e.code}</td>
                  <td>{e.msg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Token / Callback integration (seamless wallet)</h2>
          <p className="text-sm text-muted-foreground">
            A separate system from the data API above. It needs a <strong>callback-mode</strong> key
            (created on the Callbacks page) — data API keys are rejected on these endpoints.
          </p>

          <h3 className="text-base font-semibold">Keys &amp; constants on your server</h3>
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border/40"><th className="p-2">Constant</th><th>Where it comes from</th></tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/30"><td className="p-2 font-mono">HYPER_BASE</td><td>{base} — always our domain</td></tr>
              <tr className="border-b border-border/30"><td className="p-2 font-mono">HYPER_DATA_KEY</td><td>Data API key (HAPI_…) from the Keys page — only for /api/public/proxy</td></tr>
              <tr className="border-b border-border/30"><td className="p-2 font-mono">HYPER_CB_KEY</td><td>Callback-mode API key from the Callbacks page — for token + wallet endpoints</td></tr>
              <tr className="border-b border-border/30"><td className="p-2 font-mono">HYPER_CB_SECRET</td><td>Callback secret of that key (Callbacks page → Generate secret). Used for the <code className="font-mono">X-Signature</code> HMAC-SHA256 of the raw JSON body — same value on both sides.</td></tr>
              <tr className="border-b border-border/30"><td className="p-2 font-mono">HYPER_TOKEN_TTL</td><td>Token lifetime in seconds (default 300, taken from the key if omitted)</td></tr>
            </tbody>
          </table>

          <h3 className="text-base font-semibold">1 — Issue a token (your server → us)</h3>
          <pre className="overflow-x-auto rounded-md bg-secondary/40 p-3 font-mono text-xs">
{`POST ${base}/api/public/token/issue
X-Signature: <hmac_sha256(HYPER_CB_SECRET, raw_body)>

{"api_key":"HYPER_CB_KEY","user_id":"12345","ttl":300}
→ {"code":0,"token":"…","expires_at":"…","ttl":300}`}
          </pre>

          <h3 className="text-base font-semibold">2 — Player entry URL (on our domain)</h3>
          <p className="text-sm text-muted-foreground">
            Do <strong>not</strong> send the player to any third-party domain. Build the login URL with our
            entry endpoint — the token is consumed here (single-use, TTL enforced):
          </p>
          <pre className="overflow-x-auto rounded-md bg-secondary/40 p-3 font-mono text-xs">
{`$data['lotteryLoginUrl'] = "${base}/api/public/token/enter?Token=" . $gameToken;

→ {"code":0,"user_id":"12345","client":"…","allowed_games":[{"category":"wingo","games":["30s","1m","3m","5m"]}],"session_expires_at":"…"}`}
          </pre>
          <p className="text-xs text-muted-foreground">
            No api_key or signature is sent from the browser — the token itself is the credential.
            The player&apos;s domain (Origin/Referer) is checked against your token whitelist, and each
            token can be opened only once. Replay and expired hits are counted on the Callbacks page.
          </p>

          <h3 className="text-base font-semibold">3 — Wallet callbacks (us → your server)</h3>
          <p className="text-sm text-muted-foreground">
            We call your callback URL with <code className="rounded bg-secondary/40 px-1 font-mono">callback_type</code>
            {" "}= GetBalance, PlaceBet or WinLoss, signed with the same secret. Each type can be enabled
            or disabled per key.
          </p>

          <h3 className="text-base font-semibold">Whitelisting &amp; allowed games</h3>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Per callback key you add <strong>domains</strong> (<code className="font-mono">*</code>, <code className="font-mono">*.domain.com</code> or exact) and <strong>IPs</strong>, each optionally scoped to one operation (Token / GetBalance / PlaceBet / WinLoss).</li>
            <li>Empty list = everything rejected. A scoped entry allows only that operation.</li>
            <li>Playable categories come from the key&apos;s category: <span className="font-mono">wingo (30s/1m/3m/5m)</span>, <span className="font-mono">k3</span>, <span className="font-mono">d5</span>, <span className="font-mono">motorace (1m)</span>. TRX and video games are not offered by this platform.</li>
            <li>Every API key is valid for a fixed 30 days.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
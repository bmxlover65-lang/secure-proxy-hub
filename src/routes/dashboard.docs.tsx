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
  const base = "https://secure-proxy-hub.lovable.app";
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

          <h3 className="text-base font-semibold">Example response</h3>
          <pre className="overflow-x-auto rounded-md bg-secondary/40 p-3 font-mono text-xs">
{`{
  "success": true,
  "category": "wingo",
  "game": "1m",
  "data": { /* upstream payload */ }
}`}
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
    </div>
  );
}
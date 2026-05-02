import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Copy, Globe, KeyRound, ShieldCheck, AlertTriangle, FolderTree, CalendarClock } from "lucide-react";
import { SUPPORTED_GAMES } from "@/server/upstream";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/docs")({
  component: DocsPage,
});

const PUBLIC_BASE = "https://sass.hyperapi.in/api/public/proxy";

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="group relative">
      <pre className="overflow-x-auto rounded-lg border border-border/60 bg-background/60 p-3 font-mono text-xs leading-relaxed">{children}</pre>
      <Button
        size="sm" variant="ghost"
        className="absolute right-2 top-2 h-7 opacity-0 transition group-hover:opacity-100"
        onClick={() => { navigator.clipboard.writeText(children); toast.success("Copied"); }}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function DocsPage() {
  const exampleKey = "HAPI_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        title="API Documentation"
        description="Internal reference for the public proxy that you sell to clients."
      />

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Base URL</CardTitle>
          <CardDescription>All client requests go through this single endpoint.</CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock>{`GET ${PUBLIC_BASE}?api_key=...&category=...&game=...&type=...`}</CodeBlock>
        </CardContent>
      </Card>

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" /> Keys: per-category &amp; time-limited</CardTitle>
          <CardDescription>Each API key is bound to exactly one game category and expires after the configured number of days.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Issue separate keys per category — for example a WinGo key cannot call <span className="font-mono">category=k3</span>. Requests with a mismatched category return <span className="font-mono">403</span>.</p>
          <p>When a key passes its expiry date the proxy returns <span className="font-mono">403 API key expired</span>. Use the <strong className="text-foreground">Extend</strong> action on the Clients page to add more days.</p>
          <p>There is no per-minute rate limit. Access is controlled purely by category, IP whitelist, domain whitelist, and expiry.</p>
        </CardContent>
      </Card>

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Query parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Param</th>
                  <th className="px-3 py-2 text-left font-medium">Required</th>
                  <th className="px-3 py-2 text-left font-medium">Values</th>
                  <th className="px-3 py-2 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                <tr className="border-t border-border/60"><td className="px-3 py-2">api_key</td><td className="px-3 py-2">Yes</td><td className="px-3 py-2">HAPI_…</td><td className="px-3 py-2 font-sans">Client's API key.</td></tr>
                <tr className="border-t border-border/60"><td className="px-3 py-2">category</td><td className="px-3 py-2">Yes</td><td className="px-3 py-2">{SUPPORTED_GAMES.map((c) => c.category).join(" | ")}</td><td className="px-3 py-2 font-sans">Must match the category the API key was issued for.</td></tr>
                <tr className="border-t border-border/60"><td className="px-3 py-2">game</td><td className="px-3 py-2">Yes</td><td className="px-3 py-2">e.g. 30s, 1m, 3m, 5m, 10m</td><td className="px-3 py-2 font-sans">Game variant (depends on category, see below).</td></tr>
                <tr className="border-t border-border/60"><td className="px-3 py-2">type</td><td className="px-3 py-2">No</td><td className="px-3 py-2">period | history</td><td className="px-3 py-2 font-sans">"period" returns the current/next draw, "history" returns the recent draw history. Defaults to "period".</td></tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardHeader>
          <CardTitle>Supported categories &amp; games</CardTitle>
          <CardDescription>Each category supports both <span className="font-mono">period</span> and <span className="font-mono">history</span>.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {SUPPORTED_GAMES.map((c) => (
            <div key={c.category} className="rounded-lg border border-border/60 bg-secondary/20 p-3">
              <div className="mb-2 text-sm font-semibold uppercase">{c.category}</div>
              <div className="flex flex-wrap gap-1.5">
                {c.games.map((g) => <Badge key={g} variant="outline" className="font-mono text-[11px]">{g}</Badge>)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Security: IP &amp; Domain whitelist</CardTitle>
          <CardDescription>Both must pass for a request to succeed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p><strong className="text-foreground">IP check:</strong> the request's source IP must be in the client's allowed IPs list. We read <span className="font-mono">x-forwarded-for</span>, <span className="font-mono">cf-connecting-ip</span>, and <span className="font-mono">x-real-ip</span>.</p>
          <p><strong className="text-foreground">Domain check:</strong> the request's <span className="font-mono">Origin</span> (or fallback <span className="font-mono">Referer</span>) hostname must match an allowed domain. Wildcards like <span className="font-mono">*.example.com</span> are supported.</p>
          <p><strong className="text-foreground">Expiry:</strong> each key has a fixed validity window (in days) — expired keys are rejected with 403.</p>
          <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div>The upstream source URL is never returned in any response. Clients only ever see <span className="font-mono">{PUBLIC_BASE}</span>.</div>
          </div>
        </CardContent>
      </Card>

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardHeader>
          <CardTitle>Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">WinGo 30s — current period</div>
            <CodeBlock>{`curl "${PUBLIC_BASE}?api_key=${exampleKey}&category=wingo&game=30s&type=period" \\
  -H "Origin: https://example.com"`}</CodeBlock>
          </div>
          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">K3 1m — history</div>
            <CodeBlock>{`curl "${PUBLIC_BASE}?api_key=${exampleKey}&category=k3&game=1m&type=history" \\
  -H "Origin: https://example.com"`}</CodeBlock>
          </div>
          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">JavaScript (browser)</div>
            <CodeBlock>{`const res = await fetch(
  "${PUBLIC_BASE}?api_key=${exampleKey}&category=d5&game=5m&type=period"
);
const data = await res.json();`}</CodeBlock>
          </div>
          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">PHP (server-side)</div>
            <CodeBlock>{`<?php
$url = "${PUBLIC_BASE}?api_key=${exampleKey}&category=motorace&game=1m&type=period";
$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Origin: https://yourdomain.com",
    "Accept: application/json",
  ],
]);
$response = curl_exec($ch);
curl_close($ch);
echo $response;`}</CodeBlock>
          </div>
        </CardContent>
      </Card>

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardHeader>
          <CardTitle>Error responses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Code</th>
                  <th className="px-3 py-2 text-left font-medium">Meaning</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  [400, "Missing api_key", "api_key, category or game param missing"],
                  [401, "Invalid API key", "Key not found"],
                  [403, "Account suspended", "Client status is suspended"],
                  [403, "API key expired", "Validity window has passed"],
                  [403, "Wrong category", "Key was issued for a different category"],
                  [403, "IP not allowed", "Source IP not whitelisted"],
                  [403, "Domain not allowed", "Origin/Referer host not whitelisted"],
                  [404, "Unknown category/game", "Combination not supported"],
                  [502, "Upstream error", "Source temporarily unreachable"],
                ].map(([s, m, d]) => (
                  <tr key={`${s}-${m}`} className="border-t border-border/60">
                    <td className="px-3 py-2 font-mono">{s}</td>
                    <td className="px-3 py-2 font-mono">{m}</td>
                    <td className="px-3 py-2 text-muted-foreground">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FolderTree className="h-5 w-5 text-primary" /> Code map</CardTitle>
          <CardDescription>Where each piece lives in the codebase.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-3 py-2 text-left font-medium">Concern</th><th className="px-3 py-2 text-left font-medium">Path</th></tr>
              </thead>
              <tbody className="font-mono text-xs">
                {[
                  ["Public proxy endpoint", "src/routes/api/public/proxy.ts"],
                  ["Upstream URL builder & fetcher", "src/server/upstream.ts"],
                  ["Admin server functions (CRUD, tests)", "src/server/admin.functions.ts"],
                  ["Admin: API clients page", "src/routes/admin.clients.tsx"],
                  ["Admin: Health checks page", "src/routes/admin.health.tsx"],
                  ["Admin: Request logs page", "src/routes/admin.logs.tsx"],
                  ["Admin: API docs page", "src/routes/admin.docs.tsx"],
                  ["Admin layout & nav", "src/routes/admin.tsx + src/components/AppShell.tsx"],
                  ["Database schema (migrations)", "supabase/migrations/*.sql"],
                  ["Generated DB types", "src/integrations/supabase/types.ts"],
                ].map(([k, v]) => (
                  <tr key={v} className="border-t border-border/60">
                    <td className="px-3 py-2 font-sans">{k}</td>
                    <td className="px-3 py-2">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

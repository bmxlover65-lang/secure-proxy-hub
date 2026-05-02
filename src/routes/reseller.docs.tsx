import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reseller/docs")({
  component: DocsPage,
});

const ENDPOINTS = [
  { category: "wingo", games: ["30s", "1m", "3m", "5m"] },
  { category: "d5", games: ["1m", "3m", "5m", "10m"] },
  { category: "k3", games: ["1m", "3m", "5m", "10m"] },
  { category: "motorace", games: ["1m"] },
];

function DocsPage() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState("YOUR_API_KEY");
  const [base, setBase] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setBase(window.location.origin);
    if (user) {
      supabase.from("resellers").select("api_key").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => { if (data?.api_key) setApiKey(data.api_key); });
    }
  }, [user]);

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copied"); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">API Documentation</h1>
        <p className="text-sm text-muted-foreground">Use your API key to fetch live game data via the proxy.</p>
      </div>

      <Card className="border-border" style={{ background: "var(--gradient-card)" }}>
        <CardHeader><CardTitle>Endpoint format</CardTitle></CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md border border-border bg-background p-4 text-xs">
{`GET ${base || "https://your-domain"}/api/public/proxy?api_key=${apiKey}&category=<category>&game=<game>`}
          </pre>
          <p className="mt-3 text-sm text-muted-foreground">
            Returns the upstream JSON as-is. Errors return <code className="rounded bg-secondary px-1">{`{ code, msg }`}</code>.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border" style={{ background: "var(--gradient-card)" }}>
        <CardHeader><CardTitle>Supported games</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {ENDPOINTS.map(({ category, games }) => (
            <div key={category}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">{category}</h3>
              <div className="grid gap-2 md:grid-cols-2">
                {games.map((g) => {
                  const url = `${base}/api/public/proxy?api_key=${apiKey}&category=${category}&game=${g}`;
                  return (
                    <div key={g} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background p-2 text-xs">
                      <code className="truncate">{`${category} / ${g}`}</code>
                      <Button size="sm" variant="ghost" onClick={() => copy(url)}><Copy className="h-3 w-3" /></Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border" style={{ background: "var(--gradient-card)" }}>
        <CardHeader><CardTitle>Error codes</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr><th className="py-2">Code</th><th>Meaning</th></tr>
            </thead>
            <tbody>
              {[
                ["400", "Missing api_key / category / game"],
                ["401", "Invalid API key"],
                ["403", "Account suspended or IP not whitelisted"],
                ["404", "Unknown category/game combination"],
                ["429", "Rate limit exceeded"],
                ["502", "Upstream fetch error"],
              ].map(([code, msg]) => (
                <tr key={code} className="border-t border-border"><td className="py-2 font-mono">{code}</td><td>{msg}</td></tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
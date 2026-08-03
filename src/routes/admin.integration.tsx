import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getIntegrationConfig, updateIntegrationConfig } from "@/lib/integration-config.functions";
import { PageHeader } from "@/components/PageHeader";
import { TokenFlowLogs } from "@/components/TokenFlowLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plug, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/integration")({
  component: IntegrationConfigPage,
  head: () => ({
    meta: [
      { title: "Integration Config — Hyper Softs SaaS Admin" },
      { name: "description", content: "Manage HYPER_BASE, data and callback keys, callback secret, token TTL and the playable game categories used by the token integration." },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "Integration Config — Hyper Softs SaaS" },
      { property: "og:description", content: "Single place to update the integration constants used by partner servers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function IntegrationConfigPage() {
  const load = useServerFn(getIntegrationConfig);
  const save = useServerFn(updateIntegrationConfig);

  const [base, setBase] = useState("https://sass.hyperapi.in");
  const [dataKey, setDataKey] = useState("");
  const [cbKey, setCbKey] = useState("");
  const [cbSecret, setCbSecret] = useState("");
  const [ttl, setTtl] = useState(300);
  const [enforce, setEnforce] = useState(false);
  const [cats, setCats] = useState<string[]>([]);
  const [supported, setSupported] = useState<{ category: string; games: string[] }[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    load().then((r) => {
      setSupported(r.supported_categories);
      setMissing(r.missing as string[]);
      if (r.config) {
        setBase(r.config.hyper_base);
        setDataKey(r.config.hyper_data_key ?? "");
        setCbKey(r.config.hyper_cb_key ?? "");
        setCbSecret(r.config.hyper_cb_secret ?? "");
        setTtl(r.config.hyper_token_ttl);
        setEnforce(r.config.enforce_config);
        setCats(r.config.allowed_categories ?? []);
      }
    }).catch((e) => toast.error((e as Error).message));
  };
  useEffect(refresh, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCat = (c: string) =>
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const submit = async () => {
    if (cats.length === 0) { toast.error("Enable at least one game category"); return; }
    setSaving(true);
    try {
      await save({
        data: {
          hyper_base: base.trim(),
          hyper_data_key: dataKey.trim() || null,
          hyper_cb_key: cbKey.trim() || null,
          hyper_cb_secret: cbSecret.trim() || null,
          hyper_token_ttl: ttl,
          enforce_config: enforce,
          allowed_categories: cats,
        },
      });
      toast.success("Integration config saved");
      refresh();
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Plug}
        title="Integration Config"
        description="HYPER_BASE, API keys, callback secret and token TTL used by partner servers — plus the game categories this platform is allowed to serve."
      />

      {missing.length > 0 && (
        <div className="flex items-start gap-2 border border-destructive/50 bg-destructive/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <div className="font-mono text-[12px] uppercase tracking-wider text-destructive">Missing required values</div>
            <div className="text-muted-foreground">{missing.join(", ")} — enforcement cannot be switched on until these are filled.</div>
          </div>
        </div>
      )}

      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardHeader>
          <CardTitle className="font-display text-base uppercase tracking-tight">Constants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="font-mono text-[11px] uppercase tracking-wider">HYPER_BASE</Label>
              <Input value={base} onChange={(e) => setBase(e.target.value)} className="mt-1 font-mono" placeholder="https://sass.hyperapi.in" />
            </div>
            <div>
              <Label className="font-mono text-[11px] uppercase tracking-wider">HYPER_TOKEN_TTL (seconds)</Label>
              <Input type="number" min={30} max={86400} value={ttl}
                onChange={(e) => setTtl(parseInt(e.target.value || "0", 10))} className="mt-1 font-mono" />
            </div>
            <div>
              <Label className="font-mono text-[11px] uppercase tracking-wider">HYPER_DATA_KEY</Label>
              <Input value={dataKey} onChange={(e) => setDataKey(e.target.value)} className="mt-1 font-mono" placeholder="HAPI_…" />
            </div>
            <div>
              <Label className="font-mono text-[11px] uppercase tracking-wider">HYPER_CB_KEY</Label>
              <Input value={cbKey} onChange={(e) => setCbKey(e.target.value)} className="mt-1 font-mono" placeholder="callback-mode key" />
            </div>
            <div className="md:col-span-2">
              <Label className="font-mono text-[11px] uppercase tracking-wider">HYPER_CB_SECRET</Label>
              <Input value={cbSecret} onChange={(e) => setCbSecret(e.target.value)} className="mt-1 font-mono" placeholder="HMAC-SHA256 shared secret" />
              <p className="mt-1 text-xs text-muted-foreground">Must match the secret on the partner server — used for the X-Signature header.</p>
            </div>
          </div>

          <div className="border-t border-border/40 pt-4">
            <Label className="font-mono text-[11px] uppercase tracking-wider">Playable categories</Label>
            <p className="mb-2 text-xs text-muted-foreground">Only platform-supported games appear here. TRX and video flows do not exist and cannot be enabled.</p>
            <div className="flex flex-wrap gap-2">
              {supported.map((s) => (
                <Button key={s.category} size="sm" variant={cats.includes(s.category) ? "default" : "outline"}
                  onClick={() => toggleCat(s.category)} className="h-8 font-mono text-[11px] uppercase">
                  {s.category} · {s.games.join("/")}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/40 pt-4">
            <div>
              <Label className="font-mono text-[11px] uppercase tracking-wider">Block operations when config incomplete</Label>
              <p className="text-xs text-muted-foreground">Token entry returns 503 if any required value above is missing.</p>
            </div>
            <Switch checked={enforce} onCheckedChange={setEnforce} />
          </div>

          <Button onClick={submit} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />{saving ? "Saving…" : "Save config"}
          </Button>
        </CardContent>
      </Card>

      <TokenFlowLogs />
    </div>
  );
}

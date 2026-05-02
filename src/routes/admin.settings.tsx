import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminUpdateSettings, getPublicSettings } from "@/server/reseller.functions";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  const fetchSettings = useServerFn(getPublicSettings);
  const update = useServerFn(adminUpdateSettings);
  const [coinsPerKey, setCoinsPerKey] = useState(1000);
  const [rupeesPer1000, setRupeesPer1000] = useState(2000);
  const [signupBonus, setSignupBonus] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings().then((s) => {
      setCoinsPerKey(Number(s.coins_per_api_key ?? 1000));
      setRupeesPer1000(Number(s.paise_per_1000_coins ?? 2000));
      setSignupBonus(Number(s.signup_bonus_coins ?? 0));
    }).catch(() => {});
  }, [fetchSettings]);

  const save = async () => {
    setSaving(true);
    try {
      await update({ data: { coins_per_api_key: coinsPerKey, paise_per_1000_coins: Math.round(rupeesPer1000), signup_bonus_coins: signupBonus } });
      toast.success("Settings saved");
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={Settings} title="Settings" description="Pricing and signup bonus." />
      <Card style={{ background: "var(--gradient-card)" }} className="border-border/60">
        <CardContent className="p-6 space-y-4">
          <div><Label>Coins per API key</Label><Input type="number" value={coinsPerKey} onChange={(e) => setCoinsPerKey(parseInt(e.target.value || "0", 10))} /></div>
          <div>
            <Label>Price in ₹ per 1000 coins</Label>
            <Input type="number" step="1" value={rupeesPer1000} onChange={(e) => setRupeesPer1000(parseFloat(e.target.value || "0"))} />
            <p className="mt-1 text-xs text-muted-foreground">Enter rupees (e.g. <strong>2000</strong> = ₹2000 per 1000 coins).</p>
          </div>
          <div><Label>Signup bonus coins</Label><Input type="number" value={signupBonus} onChange={(e) => setSignupBonus(parseInt(e.target.value || "0", 10))} /></div>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
"use client";

import { Check, Copy, KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Scope = "TRANSACTIONS_READ" | "TRANSACTIONS_WRITE" | "SMS_IMPORT";
type TokenRecord = {
  uuid: string;
  label: string | null;
  tokenPrefix: string;
  scopes: Scope[];
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

const presets: Array<{ label: string; scopes: Scope[] }> = [
  { label: "Read only", scopes: ["TRANSACTIONS_READ"] },
  { label: "Read and write", scopes: ["TRANSACTIONS_READ", "TRANSACTIONS_WRITE"] },
  { label: "SMS import", scopes: ["SMS_IMPORT"] },
];
const scopeLabels: Record<Scope, string> = {
  TRANSACTIONS_READ: "Read transactions",
  TRANSACTIONS_WRITE: "Create and categorize transactions",
  SMS_IMPORT: "Import SMS messages",
};

function approximateDate(value: string | null) {
  if (!value) return "Never";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(new Date(value));
}

export function TokenSettings({ initialTokens, mcpUrl }: { initialTokens: TokenRecord[]; mcpUrl: string }) {
  const [tokens, setTokens] = useState(initialTokens);
  const [label, setLabel] = useState("");
  const [scopes, setScopes] = useState<Scope[]>(["TRANSACTIONS_READ"]);
  const [plainToken, setPlainToken] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function createToken() {
    if (!label.trim() || scopes.length === 0) return;
    setCreating(true);
    try {
      const response = await fetch("/api/tokens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: label.trim(), scopes }),
      });
      if (!response.ok) throw new Error("Token creation failed");
      const data = (await response.json()) as { token: string; record: TokenRecord };
      setPlainToken(data.token);
      setTokens((current) => [data.record, ...current]);
      setLabel("");
      setScopes(["TRANSACTIONS_READ"]);
    } catch {
      toast.error("Could not create the token");
    } finally {
      setCreating(false);
    }
  }

  async function revokeToken(uuid: string) {
    try {
      const response = await fetch(`/api/tokens/${uuid}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Token revocation failed");
      setTokens((current) => current.map((token) => token.uuid === uuid ? { ...token, revokedAt: new Date().toISOString() } : token));
      toast.success("Token revoked");
    } catch {
      toast.error("Could not revoke the token");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-secondary-foreground">Create personal API tokens for MCP clients and SMS import.</p>
      </div>

      {plainToken ? (
        <Card className="border-primary bg-[var(--paper-mint)]">
          <CardHeader>
            <CardTitle>Copy this token now</CardTitle>
            <p className="mt-1 text-sm text-secondary-foreground">TrackCrow will not show it again.</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <code className="min-w-0 flex-1 break-all rounded-md border bg-card p-3 text-sm">{plainToken}</code>
            <Button onClick={() => void navigator.clipboard.writeText(plainToken).then(() => toast.success("Token copied"))}><Copy className="h-4 w-4" /> Copy</Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Create a token</CardTitle><p className="mt-1 text-sm text-secondary-foreground">Permissions cannot be changed after creation.</p></CardHeader>
        <CardContent className="space-y-5">
          <label className="block text-sm font-bold">Name<input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={100} placeholder="Codex on laptop" className="mt-2 w-full rounded-md border-2 border-border bg-background px-3 py-2 font-normal" /></label>
          <div className="grid gap-2 sm:grid-cols-3">
            {presets.map((preset) => <button key={preset.label} type="button" onClick={() => setScopes(preset.scopes)} className={cn("rounded-md border-2 p-3 text-left text-sm font-bold", JSON.stringify(scopes) === JSON.stringify(preset.scopes) ? "border-foreground bg-primary" : "border-border bg-card")}>{preset.label}</button>)}
          </div>
          <fieldset className="space-y-2"><legend className="mb-2 text-sm font-bold">Custom permissions</legend>{(Object.keys(scopeLabels) as Scope[]).map((scope) => <label key={scope} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={scopes.includes(scope)} onChange={(event) => setScopes((current) => event.target.checked ? [...current, scope] : current.filter((value) => value !== scope))} className="h-4 w-4" />{scopeLabels[scope]}</label>)}</fieldset>
          <Button disabled={creating || !label.trim() || scopes.length === 0} onClick={() => void createToken()}><KeyRound className="h-4 w-4" />{creating ? "Creating..." : "Create token"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Personal API tokens</CardTitle><p className="mt-1 text-sm text-secondary-foreground">Last-used times are approximate and update at most once every ten minutes.</p></CardHeader>
        <CardContent className="space-y-3">
          {tokens.length === 0 ? <p className="text-sm text-secondary-foreground">No tokens yet.</p> : tokens.map((token) => (
            <div key={token.uuid} className="rounded-md border-2 border-border p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div><div className="flex items-center gap-2 font-bold">{token.label ?? "Unnamed token"}{token.revokedAt ? <span className="rounded bg-secondary px-2 py-0.5 text-xs">Revoked</span> : null}</div><p className="mt-1 font-mono text-xs text-secondary-foreground">{token.tokenPrefix}...</p></div>
                {!token.revokedAt ? <Button variant="secondary" onClick={() => void revokeToken(token.uuid)}>Revoke</Button> : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">{token.scopes.map((scope) => <span key={scope} className="rounded bg-secondary px-2 py-1 text-xs font-semibold"><Check className="mr-1 inline h-3 w-3" />{scopeLabels[scope]}</span>)}</div>
              <p className="mt-3 text-xs text-secondary-foreground">Created {new Date(token.createdAt).toLocaleDateString()} · Last used {approximateDate(token.lastUsedAt)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>MCP setup</CardTitle><p className="mt-1 text-sm text-secondary-foreground">Use the token as an HTTP Bearer credential. Session cookies do not work here.</p></CardHeader>
        <CardContent className="space-y-3 text-sm"><p>Server URL: <code className="rounded bg-secondary px-2 py-1">{mcpUrl}</code></p><pre className="overflow-x-auto rounded-md border bg-secondary p-3">{`Authorization: Bearer <your-token>`}</pre><p>Transaction creation uses INR and requires an existing recipient UUID. Dates are interpreted in Asia/Kolkata. Do not retry a create call after an uncertain response because it may create a duplicate.</p></CardContent>
      </Card>
    </div>
  );
}

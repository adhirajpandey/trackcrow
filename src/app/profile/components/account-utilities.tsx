'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type DeviceTokenRecord = {
  id: number;
  uuid: string;
  label: string | null;
  tokenPrefix: string;
  createdAt: Date | string;
  lastUsedAt: Date | string | null;
  revokedAt: Date | string | null;
};

export function AccountUtilities({
  initialTokens,
}: {
  initialTokens: DeviceTokenRecord[];
}) {
  const [tokens, setTokens] = useState<DeviceTokenRecord[]>(initialTokens);
  const [open, setOpen] = useState(false);
  const [plainToken, setPlainToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const activeTokens = useMemo(
    () => tokens.filter((token) => !token.revokedAt),
    [tokens]
  );

  async function createToken() {
    setCreating(true);
    try {
      const response = await fetch('/api/device-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }
      const data = await response.json();
      setTokens((current) => [data.record, ...current]);
      setPlainToken(data.token);
      setOpen(true);
      toast.success('Device token created');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create token');
    } finally {
      setCreating(false);
    }
  }

  async function revokeToken(tokenId: number) {
    setRevokingId(tokenId);
    try {
      const response = await fetch(`/api/device-tokens/${tokenId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }
      setTokens((current) =>
        current.map((token) =>
          token.id === tokenId ? { ...token, revokedAt: new Date().toISOString() } : token
        )
      );
      toast.success('Token revoked');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to revoke token');
    } finally {
      setRevokingId(null);
    }
  }

  async function copyToken() {
    if (!plainToken) {
      return;
    }
    try {
      await navigator.clipboard.writeText(plainToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Failed to copy token');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2">
        <Button type="button" onClick={createToken} disabled={creating}>
          {creating ? 'Creating...' : 'Create Token'}
        </Button>
      </div>

      <div className="space-y-3">
        {activeTokens.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active device tokens.</p>
        ) : (
          activeTokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div className="min-w-0">
                <div className="font-mono text-sm">{token.tokenPrefix}...</div>
                <div className="text-xs text-muted-foreground">
                  {token.label || 'Unnamed token'}
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => revokeToken(token.id)}
                disabled={revokingId === token.id}
              >
                {revokingId === token.id ? 'Revoking...' : 'Revoke'}
              </Button>
            </div>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Device Token</DialogTitle>
            <DialogDescription>
              This token is shown only once. Store it on the client device now.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="break-all rounded border bg-muted px-3 py-2 font-mono text-sm">
              {plainToken}
            </div>
            <Button size="sm" variant="secondary" onClick={copyToken}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Use device tokens to authenticate SMS imports from trusted client devices.
        </p>
      </div>
    </div>
  );
}

'use client';

import { useActionState, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  getOrCreateTokenAction,
  revokeTokenAction,
  type TokenActionState,
  type RevokeTokenActionState,
} from '../actions';

export function AccountUtilities({ hasTokenInitially = false }: { hasTokenInitially?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasToken, setHasToken] = useState<boolean>(hasTokenInitially);
  const [state, formAction, isPending] = useActionState<TokenActionState, FormData>(
    getOrCreateTokenAction,
    { token: null, error: null }
  );
  const [revokeState, revokeAction, revokePending] = useActionState<
    RevokeTokenActionState,
    FormData
  >(revokeTokenAction, { success: false, error: null });

  useEffect(() => {
    if (!isPending && state?.token) {
      setOpen(true);
      setHasToken(true);
    }
  }, [isPending, state?.token]);

  useEffect(() => {
    if (open) setCopied(false);
  }, [open]);

  useEffect(() => {
    if (!revokePending && revokeState?.success) {
      setOpen(false);
      toast.success('Token revoked');
      setHasToken(false);
    }
  }, [revokePending, revokeState?.success]);

  const copyToken = useCallback(async () => {
    if (!state?.token) return;
    try {
      await navigator.clipboard.writeText(state.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }, [state?.token]);

  return (
    <div className="space-y-3">
      <Toaster />
      <div className="flex items-center gap-2 pb-4">
        <form action={formAction}>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Loading…' : 'Get Token'}
          </Button>
        </form>
        <form action={revokeAction}>
          <Button type="submit" variant="destructive" disabled={!hasToken || revokePending}>
            {revokePending ? 'Revoking…' : 'Revoke Token'}
          </Button>
        </form>
      </div>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Device Token</DialogTitle>
            <DialogDescription>
              Use this token on your client devices.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm font-mono break-all bg-muted px-3 py-2 rounded border">
              {state?.token}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={copyToken}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Use this token to authenticate the app on your mobile device. If you
          believe your token is compromised, revoke it and generate a new one.
        </p>
      </div>
    </div>
  );
}

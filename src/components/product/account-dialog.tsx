"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function AccountDialog(props: {
  open: boolean;
  title: string;
  description: string;
  initialName?: string;
  pending: boolean;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
}) {
  if (!props.open) return null;
  return <AccountDialogForm key={`${props.title}:${props.initialName ?? ""}`} {...props} />;
}

function AccountDialogForm(props: {
  open: boolean;
  title: string;
  description: string;
  initialName?: string;
  pending: boolean;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(props.initialName ?? "");

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => { event.preventDefault(); if (name.trim()) props.onSubmit(name); }}>
          <label className="text-sm font-medium text-foreground" htmlFor="account-name">Account name</label>
          <input
            id="account-name"
            autoFocus
            maxLength={100}
            value={name}
            disabled={props.pending}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-[8px] border-2 border-input bg-card px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {props.error ? <p role="alert" className="mt-2 text-sm text-destructive">{props.error}</p> : null}
          <DialogFooter className="mt-5">
            <Button type="button" variant="secondary" disabled={props.pending} onClick={() => props.onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={props.pending || !name.trim()}>
              {props.pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              Save account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

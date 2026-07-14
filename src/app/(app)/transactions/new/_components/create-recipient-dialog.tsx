"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateRecipientMutation } from "@/features/recipients/mutations";
import type {
  RecipientCreateConflict,
  RecipientCreateDto,
} from "@/features/recipients/types";
import { ApiClientError, getApiClientErrorMessage } from "@/lib/api/client";

const inputClassName =
  "min-h-11 w-full rounded-[8px] border-2 border-input bg-card px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-secondary-foreground/85 focus-visible:ring-2 focus-visible:ring-ring";

export function CreateRecipientDialog({
  open,
  suggestedName,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  suggestedName: string;
  onOpenChange: (open: boolean) => void;
  onSelect: (
    recipient: Pick<RecipientCreateDto, "uuid" | "displayName">,
  ) => void;
}) {
  const [displayName, setDisplayName] = useState(suggestedName);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<
    RecipientCreateConflict["existingRecipient"] | null
  >(null);
  const mutation = useCreateRecipientMutation();

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = displayName.trim();
    if (!name) {
      setError("Recipient name is required");
      return;
    }

    setError(null);
    setConflict(null);
    try {
      const recipient = await mutation.mutateAsync({ displayName: name });
      onSelect(recipient);
      onOpenChange(false);
    } catch (caught) {
      if (caught instanceof ApiClientError && caught.status === 409) {
        const details = caught.body?.details;
        if (
          details &&
          typeof details === "object" &&
          "existingRecipient" in details
        ) {
          const existing = details.existingRecipient;
          if (
            existing &&
            typeof existing === "object" &&
            "uuid" in existing &&
            "displayName" in existing &&
            typeof existing.uuid === "string" &&
            typeof existing.displayName === "string"
          ) {
            setConflict({
              uuid: existing.uuid,
              displayName: existing.displayName,
            });
            return;
          }
        }
      }
      setError(
        getApiClientErrorMessage(
          caught,
          "Unable to create this recipient right now.",
        ),
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Recipient</DialogTitle>
            <DialogDescription>
              Add a recipient to your workspace and select it for this
              transaction.
            </DialogDescription>
          </DialogHeader>

          <label className="mt-5 block text-sm font-medium text-foreground">
            Recipient name
            <input
              name="displayName"
              autoComplete="off"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className={`${inputClassName} mt-2`}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "recipient-create-error" : undefined}
            />
          </label>

          {conflict ? (
            <div className="mt-4 rounded-[8px] border-2 border-border bg-[#fff1bd] p-4">
              <p className="text-sm font-semibold text-foreground">
                A matching recipient exists
              </p>
              <p className="mt-1 break-words text-sm text-secondary-foreground">
                {conflict.displayName}
              </p>
              <Button
                type="button"
                className="mt-3 w-full sm:w-auto"
                onClick={() => {
                  onSelect(conflict);
                  onOpenChange(false);
                }}
              >
                Use Existing Recipient
              </Button>
            </div>
          ) : null}

          {error ? (
            <p
              id="recipient-create-error"
              role="alert"
              className="mt-3 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : null}
              {mutation.isPending ? "Creating…" : "Create Recipient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



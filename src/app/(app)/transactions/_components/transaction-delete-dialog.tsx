"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function TransactionDeleteDialog({
  transactionId,
  isDeleting,
  onDelete,
  trigger,
}: {
  transactionId: number;
  isDeleting: boolean;
  onDelete: () => Promise<void>;
  trigger: ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes TXN-{transactionId} from the ledger and unlinks any
            raw-message reference. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void onDelete()}
            >
              {isDeleting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete transaction
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

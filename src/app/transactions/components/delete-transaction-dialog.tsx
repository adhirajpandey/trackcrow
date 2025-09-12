'use client';

import { useState } from 'react';
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
} from '@/components/ui/alert-dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Trash } from 'lucide-react';
import { toast } from 'sonner';
import { deleteTransaction } from '../[id]/actions';

interface DeleteTransactionDialogProps {
  /** The ID of the transaction to delete */
  transactionId: number;
  /** Callback function called after successful deletion */
  onSuccess?: () => void;
  /** Callback function called when dialog closes (used to collapse dropdown) */
  onClose?: () => void;
}

/**
 * A dialog component for confirming and deleting transactions
 * Renders as a dropdown menu item that opens a confirmation dialog
 */
export function DeleteTransactionDialog({ 
  transactionId, 
  onSuccess,
  onClose
}: DeleteTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      const result = await deleteTransaction(transactionId);
      
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        // Success - close dialog, show toast, and trigger refresh
        setOpen(false);
        setError(null);
        toast.success('Transaction deleted successfully');
        onSuccess?.(); // Call the success callback to refresh the table
      }
    } catch {
      const errorMessage = 'An unexpected error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Dialog is closing, trigger the onClose callback
      onClose?.();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="cursor-pointer text-red-500"
          onSelect={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <Trash className="h-4 w-4 mr-2" />
          Delete Transaction
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this transaction.
            {error && <p className="text-red-500 text-sm pt-2">{error}</p>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

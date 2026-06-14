'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { getApiErrorMessage, resetCategoryDefaults } from '@/lib/api-client';

export function ResetAllDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    setError(null);
    
    try {
      await resetCategoryDefaults();
      setError(null);
      setOpen(false);
      toast.success('Categories reset to default successfully');
      router.refresh();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Failed to reset categories');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsResetting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setError(null);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setError(null);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">Reset All</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete all your
            categories and subcategories and reset them to the default settings.
            {error && <p className="text-red-500 text-sm pt-2">{error}</p>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting} onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset} disabled={isResetting}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import { createCategoryRecord, getApiErrorMessage } from '@/lib/api-client';

export function AddCategoryDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();

    if (!name) {
      setError('Invalid fields');
      setIsSaving(false);
      return;
    }

    try {
      await createCategoryRecord({ name });
      setError(null);
      setOpen(false);
      router.refresh();
    } catch (error) {
      setError(getApiErrorMessage(error, 'Failed to add category'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>
            Create a new category to organize your transactions.
            {error && <p className="text-red-500 text-sm pt-2">{error}</p>}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="col-span-1">
                Name
              </Label>
              <Input id="name" name="name" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

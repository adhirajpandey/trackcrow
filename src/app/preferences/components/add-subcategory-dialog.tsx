'use client';

import { useState } from 'react';
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
import { addSubcategory } from '../actions';

export function AddSubcategoryDialog({ categoryId }: { categoryId: number }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formAction = async (formData: FormData) => {
    const result = await addSubcategory(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setError(null);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Subcategory
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Subcategory</DialogTitle>
          <DialogDescription>
            Create a new subcategory.
            {error && <p className="text-red-500 text-sm pt-2">{error}</p>}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="col-span-1">
                Name
              </Label>
              <Input id="name" name="name" className="col-span-3" />
              <input type="hidden" name="categoryId" value={categoryId} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
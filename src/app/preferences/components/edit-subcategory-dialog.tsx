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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit } from 'lucide-react';
import { getApiErrorMessage, updateSubcategoryRecord } from '@/lib/api-client';
import type { CategoryOption } from '@/common/types';

export function EditSubcategoryDialog({
  subcategory,
  categories,
}: {
  subcategory: CategoryOption["subcategories"][number];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const categoryId = Number(formData.get('categoryId'));

    if (!name || !Number.isFinite(categoryId) || categoryId <= 0) {
      setError('Invalid fields');
      setIsSaving(false);
      return;
    }

    try {
      await updateSubcategoryRecord(subcategory.id, { name, categoryId });
      setError(null);
      setOpen(false);
      router.refresh();
    } catch (error) {
      setError(getApiErrorMessage(error, 'Failed to edit subcategory'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Subcategory</DialogTitle>
          <DialogDescription>
            Update your subcategory.
            {error && <p className="text-red-500 text-sm pt-2">{error}</p>}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={subcategory.name}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select name="categoryId" defaultValue={String(subcategory.categoryId)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { unwrapOrResponse } from '@/server/api/responses';
import { requireSessionUser } from '@/server/auth/session';
import {
  createCategory,
  createSubcategory,
  deleteCategory as deleteCategoryMutation,
  deleteSubcategory as deleteSubcategoryMutation,
  updateCategory,
  updateSubcategory,
} from '@/server/modules/categories/mutations';
import { resetCategoriesToDefault } from '@/server/modules/categories/service';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

const subcategorySchema = z.object({
  name: z.string().min(1, 'Subcategory name is required'),
  categoryId: z.number(),
});

async function getUserUuid() {
  const session = await requireSessionUser();
  const sessionData = unwrapOrResponse(session);
  if (sessionData instanceof Response) {
    return null;
  }

  return sessionData.userUuid;
}

export async function addCategory(formData: FormData) {
  const userUuid = await getUserUuid();
  if (!userUuid) {
    return { error: 'Unauthorized' };
  }

  const validatedFields = categorySchema.safeParse({
    name: formData.get('name'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  const result = await createCategory(userUuid, { name: validatedFields.data.name });

  if (!result.ok) {
    return { error: 'Failed to add category' };
  }

  revalidatePath('/preferences');
}

export async function addSubcategory(formData: FormData) {
  const userUuid = await getUserUuid();
  if (!userUuid) {
    return { error: 'Unauthorized' };
  }

  const validatedFields = subcategorySchema.safeParse({
    name: formData.get('name'),
    categoryId: Number(formData.get('categoryId')),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  const result = await createSubcategory(userUuid, validatedFields.data);

  if (!result.ok) {
    return { error: 'Failed to add subcategory' };
  }

  revalidatePath('/preferences');
}

export async function editCategory(formData: FormData) {
  const userUuid = await getUserUuid();
  if (!userUuid) {
    return { error: 'Unauthorized' };
  }

  const categoryId = Number(formData.get('categoryId'));
  const validatedFields = categorySchema.safeParse({
    name: formData.get('name'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  const result = await updateCategory(userUuid, categoryId, {
    name: validatedFields.data.name,
  });

  if (!result.ok) {
    return { error: 'Failed to edit category' };
  }

  revalidatePath('/preferences');
}

export async function editSubcategory(formData: FormData) {
  const userUuid = await getUserUuid();
  if (!userUuid) {
    return { error: 'Unauthorized' };
  }

  const subcategoryId = Number(formData.get('subcategoryId'));
  const validatedFields = subcategorySchema.safeParse({
    name: formData.get('name'),
    categoryId: Number(formData.get('categoryId')),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  const result = await updateSubcategory(userUuid, subcategoryId, validatedFields.data);

  if (!result.ok) {
    return { error: 'Failed to edit subcategory' };
  }

  revalidatePath('/preferences');
}

export async function deleteCategory(categoryId: number) {
  const userUuid = await getUserUuid();
  if (!userUuid) {
    return { error: 'Unauthorized' };
  }

  const result = await deleteCategoryMutation(userUuid, categoryId);
  if (!result.ok) {
    return { error: 'Failed to delete category' };
  }

  revalidatePath('/preferences');
}

export async function deleteSubcategory(subcategoryId: number) {
  const userUuid = await getUserUuid();
  if (!userUuid) {
    return { error: 'Unauthorized' };
  }

  const result = await deleteSubcategoryMutation(userUuid, subcategoryId);
  if (!result.ok) {
    return { error: 'Failed to delete subcategory' };
  }

  revalidatePath('/preferences');
}

export async function resetToDefault() {
  const userUuid = await getUserUuid();
  if (!userUuid) {
    return { error: 'Unauthorized' };
  }

  const result = await resetCategoriesToDefault(userUuid);
  if (!result.ok) {
    return { error: 'Failed to reset categories' };
  }

  revalidatePath('/preferences');
}

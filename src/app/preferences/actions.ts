'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUserSession } from '@/services/auth/guard-service';
import {
  addCategoryService,
  addSubcategoryService,
  deleteCategoryService,
  deleteSubcategoryService,
  editCategoryService,
  editSubcategoryService,
  resetToDefaultService,
} from '@/services/preferences/preferences-service';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

const subcategorySchema = z.object({
  name: z.string().min(1, 'Subcategory name is required'),
  categoryId: z.number(),
});

async function getUserUuid() {
  const session = await requireUserSession();
  if (!session.ok) {
    return null;
  }

  return session.data.userUuid;
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

  const result = await addCategoryService({
    userUuid,
    name: validatedFields.data.name,
  });

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

  const result = await addSubcategoryService({
    userUuid,
    name: validatedFields.data.name,
    categoryId: validatedFields.data.categoryId,
  });

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

  const result = await editCategoryService({
    userUuid,
    categoryId,
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

  const result = await editSubcategoryService({
    userUuid,
    subcategoryId,
    name: validatedFields.data.name,
    categoryId: validatedFields.data.categoryId,
  });

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

  const result = await deleteCategoryService({ userUuid, categoryId });
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

  const result = await deleteSubcategoryService({ userUuid, subcategoryId });
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

  const result = await resetToDefaultService({ userUuid });
  if (!result.ok) {
    return { error: 'Failed to reset categories' };
  }

  revalidatePath('/preferences');
}

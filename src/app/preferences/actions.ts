'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  createCategoryRecord,
  createSubcategoryRecord,
  deleteCategoryRecord,
  deleteSubcategoryRecord,
  getApiErrorMessage,
  resetCategoryDefaults,
  updateCategoryRecord,
  updateSubcategoryRecord,
} from '@/lib/internal-api';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

const subcategorySchema = z.object({
  name: z.string().min(1, 'Subcategory name is required'),
  categoryId: z.number(),
});

export async function addCategory(formData: FormData) {
  const validatedFields = categorySchema.safeParse({
    name: formData.get('name'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  try {
    await createCategoryRecord({ name: validatedFields.data.name });
  } catch (error) {
    return { error: getApiErrorMessage(error, 'Failed to add category') };
  }

  revalidatePath('/preferences');
}

export async function addSubcategory(formData: FormData) {
  const validatedFields = subcategorySchema.safeParse({
    name: formData.get('name'),
    categoryId: Number(formData.get('categoryId')),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  try {
    await createSubcategoryRecord(validatedFields.data);
  } catch (error) {
    return { error: getApiErrorMessage(error, 'Failed to add subcategory') };
  }

  revalidatePath('/preferences');
}

export async function editCategory(formData: FormData) {
  const categoryId = Number(formData.get('categoryId'));
  const validatedFields = categorySchema.safeParse({
    name: formData.get('name'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  try {
    await updateCategoryRecord(categoryId, {
      name: validatedFields.data.name,
    });
  } catch (error) {
    return { error: getApiErrorMessage(error, 'Failed to edit category') };
  }

  revalidatePath('/preferences');
}

export async function editSubcategory(formData: FormData) {
  const subcategoryId = Number(formData.get('subcategoryId'));
  const validatedFields = subcategorySchema.safeParse({
    name: formData.get('name'),
    categoryId: Number(formData.get('categoryId')),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  try {
    await updateSubcategoryRecord(subcategoryId, validatedFields.data);
  } catch (error) {
    return { error: getApiErrorMessage(error, 'Failed to edit subcategory') };
  }

  revalidatePath('/preferences');
}

export async function deleteCategory(categoryId: number) {
  try {
    await deleteCategoryRecord(categoryId);
  } catch (error) {
    return { error: getApiErrorMessage(error, 'Failed to delete category') };
  }

  revalidatePath('/preferences');
}

export async function deleteSubcategory(subcategoryId: number) {
  try {
    await deleteSubcategoryRecord(subcategoryId);
  } catch (error) {
    return { error: getApiErrorMessage(error, 'Failed to delete subcategory') };
  }

  revalidatePath('/preferences');
}

export async function resetToDefault() {
  try {
    await resetCategoryDefaults();
  } catch (error) {
    return { error: getApiErrorMessage(error, 'Failed to reset categories') };
  }

  revalidatePath('/preferences');
}

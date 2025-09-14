'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { defaultCategoriesMap } from '@/common/utils';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

const subcategorySchema = z.object({
  name: z.string().min(1, 'Subcategory name is required'),
  categoryId: z.number(),
});


export async function addCategory(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.uuid) {
    return { error: 'Unauthorized' };
  }

  const validatedFields = categorySchema.safeParse({
    name: formData.get('name'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  await prisma.category.create({
    data: {
      name: validatedFields.data.name,
      user_uuid: session.user.uuid,
    },
  });

  revalidatePath('/preferences');
}

export async function addSubcategory(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.uuid) {
    return { error: 'Unauthorized' };
  }

  const validatedFields = subcategorySchema.safeParse({
    name: formData.get('name'),
    categoryId: Number(formData.get('categoryId')),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  await prisma.subcategory.create({
    data: {
      name: validatedFields.data.name,
      categoryId: validatedFields.data.categoryId,
      user_uuid: session.user.uuid,
    },
  });

  revalidatePath('/preferences');
}

export async function editCategory(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.uuid) {
        return { error: 'Unauthorized' };
    }

    const categoryId = Number(formData.get('categoryId'));
    const validatedFields = categorySchema.safeParse({
        name: formData.get('name'),
    });

    if (!validatedFields.success) {
        return { error: 'Invalid fields' };
    }

    await prisma.category.update({
        where: {
            id: categoryId,
            user_uuid: session.user.uuid,
        },
        data: {
            name: validatedFields.data.name,
        },
    });

    revalidatePath('/preferences');
}

export async function editSubcategory(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.uuid) {
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

    await prisma.subcategory.update({
        where: {
            id: subcategoryId,
            user_uuid: session.user.uuid,
        },
        data: {
            name: validatedFields.data.name,
            categoryId: validatedFields.data.categoryId,
        },
    });

    revalidatePath('/preferences');
}

export async function deleteCategory(categoryId: number) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.uuid) {
        return { error: 'Unauthorized' };
    }

    await prisma.category.delete({
        where: {
            id: categoryId,
            user_uuid: session.user.uuid,
        },
    });

    revalidatePath('/preferences');
}

export async function deleteSubcategory(subcategoryId: number) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.uuid) {
        return { error: 'Unauthorized' };
    }

    await prisma.subcategory.delete({
        where: {
            id: subcategoryId,
            user_uuid: session.user.uuid,
        },
    });

    revalidatePath('/preferences');
}

export async function resetToDefault() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.uuid) {
        return { error: 'Unauthorized' };
    }
    const user_uuid = session.user.uuid;

    await prisma.category.deleteMany({ where: { user_uuid: user_uuid } });

    for (const category of defaultCategoriesMap) {
        const createdCategory = await prisma.category.create({
            data: {
                name: category.name,
                user_uuid: user_uuid,
            },
        });

        if (category.subcategories.length > 0) {
            await prisma.subcategory.createMany({
                data: category.subcategories.map((subcategoryName) => ({
                    name: subcategoryName,
                    categoryId: createdCategory.id,
                    user_uuid: user_uuid,
                })),
            });
        }
    }

    revalidatePath('/preferences');
}

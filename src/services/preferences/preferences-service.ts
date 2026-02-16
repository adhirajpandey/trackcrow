import prisma from '@/lib/prisma';
import { defaultCategoriesMap } from '@/common/utils';
import { logger } from '@/lib/logger';
import { fail, ok, type ServiceResult } from '@/services/shared/result';

export async function addCategoryService(input: {
  userUuid: string;
  name: string;
}): Promise<ServiceResult<{ id: number }, 'INTERNAL_ERROR'>> {
  try {
    const category = await prisma.category.create({
      data: {
        name: input.name,
        user_uuid: input.userUuid,
      },
      select: { id: true },
    });
    return ok(category);
  } catch (error) {
    logger.error('addCategoryService - Failed to add category', error as Error, {
      userUuid: input.userUuid,
    });
    return fail('INTERNAL_ERROR');
  }
}

export async function addSubcategoryService(input: {
  userUuid: string;
  name: string;
  categoryId: number;
}): Promise<ServiceResult<{ id: number }, 'INTERNAL_ERROR'>> {
  try {
    const subcategory = await prisma.subcategory.create({
      data: {
        name: input.name,
        categoryId: input.categoryId,
        user_uuid: input.userUuid,
      },
      select: { id: true },
    });
    return ok(subcategory);
  } catch (error) {
    logger.error('addSubcategoryService - Failed to add subcategory', error as Error, {
      userUuid: input.userUuid,
      categoryId: input.categoryId,
    });
    return fail('INTERNAL_ERROR');
  }
}

export async function editCategoryService(input: {
  userUuid: string;
  categoryId: number;
  name: string;
}): Promise<ServiceResult<{ id: number }, 'INTERNAL_ERROR'>> {
  try {
    const category = await prisma.category.update({
      where: {
        id: input.categoryId,
        user_uuid: input.userUuid,
      },
      data: {
        name: input.name,
      },
      select: { id: true },
    });

    return ok(category);
  } catch (error) {
    logger.error('editCategoryService - Failed to edit category', error as Error, {
      userUuid: input.userUuid,
      categoryId: input.categoryId,
    });
    return fail('INTERNAL_ERROR');
  }
}

export async function editSubcategoryService(input: {
  userUuid: string;
  subcategoryId: number;
  name: string;
  categoryId: number;
}): Promise<ServiceResult<{ id: number }, 'INTERNAL_ERROR'>> {
  try {
    const subcategory = await prisma.subcategory.update({
      where: {
        id: input.subcategoryId,
        user_uuid: input.userUuid,
      },
      data: {
        name: input.name,
        categoryId: input.categoryId,
      },
      select: { id: true },
    });

    return ok(subcategory);
  } catch (error) {
    logger.error('editSubcategoryService - Failed to edit subcategory', error as Error, {
      userUuid: input.userUuid,
      subcategoryId: input.subcategoryId,
    });
    return fail('INTERNAL_ERROR');
  }
}

export async function deleteCategoryService(input: {
  userUuid: string;
  categoryId: number;
}): Promise<ServiceResult<{ id: number }, 'INTERNAL_ERROR'>> {
  try {
    const category = await prisma.category.delete({
      where: {
        id: input.categoryId,
        user_uuid: input.userUuid,
      },
      select: { id: true },
    });
    return ok(category);
  } catch (error) {
    logger.error('deleteCategoryService - Failed to delete category', error as Error, {
      userUuid: input.userUuid,
      categoryId: input.categoryId,
    });
    return fail('INTERNAL_ERROR');
  }
}

export async function deleteSubcategoryService(input: {
  userUuid: string;
  subcategoryId: number;
}): Promise<ServiceResult<{ id: number }, 'INTERNAL_ERROR'>> {
  try {
    const subcategory = await prisma.subcategory.delete({
      where: {
        id: input.subcategoryId,
        user_uuid: input.userUuid,
      },
      select: { id: true },
    });
    return ok(subcategory);
  } catch (error) {
    logger.error('deleteSubcategoryService - Failed to delete subcategory', error as Error, {
      userUuid: input.userUuid,
      subcategoryId: input.subcategoryId,
    });
    return fail('INTERNAL_ERROR');
  }
}

export async function resetToDefaultService(input: {
  userUuid: string;
}): Promise<ServiceResult<{ reset: true }, 'INTERNAL_ERROR'>> {
  try {
    await prisma.category.deleteMany({ where: { user_uuid: input.userUuid } });

    for (const category of defaultCategoriesMap) {
      const createdCategory = await prisma.category.create({
        data: {
          name: category.name,
          user_uuid: input.userUuid,
        },
      });

      if (category.subcategories.length > 0) {
        await prisma.subcategory.createMany({
          data: category.subcategories.map((subcategoryName) => ({
            name: subcategoryName,
            categoryId: createdCategory.id,
            user_uuid: input.userUuid,
          })),
        });
      }
    }

    return ok({ reset: true });
  } catch (error) {
    logger.error('resetToDefaultService - Failed to reset categories', error as Error, {
      userUuid: input.userUuid,
    });
    return fail('INTERNAL_ERROR');
  }
}

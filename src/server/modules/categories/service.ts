import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

import { defaultCategories } from "./defaults";
import type {
  CategoryDeleteInput,
  CategoryDto,
  CategoryListInput,
  CategoryUpdateInput,
  CategoryWriteInput,
  SubcategoryDeleteInput,
  SubcategoryUpdateInput,
  SubcategoryWriteInput,
} from "./types";

function toCategoryDto(category: {
  id: number;
  uuid: string;
  name: string;
  subcategories: Array<{ id: number; uuid: string; name: string }>;
}): CategoryDto {
  return {
    id: category.id,
    uuid: category.uuid,
    name: category.name,
    subcategories: category.subcategories.map((subcategory) => ({
      id: subcategory.id,
      uuid: subcategory.uuid,
      name: subcategory.name,
    })),
  };
}

export async function ensureDefaultCategoriesForUser(
  input: { userUuid: string }
): Promise<ServiceResult<{ created: boolean }, "INTERNAL_ERROR">> {
  try {
    const existingCount = await prisma.category.count({
      where: { userUuid: input.userUuid },
    });

    if (existingCount > 0) {
      return ok({ created: false });
    }

    for (const category of defaultCategories) {
      const createdCategory = await prisma.category.create({
        data: {
          userUuid: input.userUuid,
          name: category.name,
        },
      });

      await prisma.subcategory.createMany({
        data: category.subcategories.map((name) => ({
          userUuid: input.userUuid,
          categoryId: createdCategory.id,
          name,
        })),
      });
    }

    return ok({ created: true });
  } catch (error) {
    logger.error("ensureDefaultCategoriesForUser - Failed to seed categories", error as Error, {
      userUuid: input.userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function listCategoriesForUser(
  input: CategoryListInput
): Promise<ServiceResult<CategoryDto[], "INTERNAL_ERROR">> {
  try {
    const categories = await prisma.category.findMany({
      where: { userUuid: input.userUuid },
      include: {
        subcategories: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return ok(categories.map(toCategoryDto));
  } catch (error) {
    logger.error("listCategoriesForUser - Failed to read categories", error as Error, {
      userUuid: input.userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function resetCategoriesToDefault(
  input: { userUuid: string }
): Promise<ServiceResult<{ reset: true }, "INTERNAL_ERROR">> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.subcategory.deleteMany({ where: { userUuid: input.userUuid } });
      await tx.category.deleteMany({ where: { userUuid: input.userUuid } });

      for (const category of defaultCategories) {
        const createdCategory = await tx.category.create({
          data: {
            userUuid: input.userUuid,
            name: category.name,
          },
        });

        await tx.subcategory.createMany({
          data: category.subcategories.map((name) => ({
            userUuid: input.userUuid,
            categoryId: createdCategory.id,
            name,
          })),
        });
      }
    });

    return ok({ reset: true });
  } catch (error) {
    logger.error("resetCategoriesToDefault - Failed to reset categories", error as Error, {
      userUuid: input.userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function createCategory(
  input: CategoryWriteInput
): Promise<ServiceResult<{ id: number; uuid: string }, "CONFLICT" | "INTERNAL_ERROR">> {
  try {
    const category = await prisma.category.create({
      data: {
        userUuid: input.userUuid,
        name: input.name.trim(),
      },
      select: { id: true, uuid: true },
    });

    return ok(category);
  } catch (error: any) {
    logger.error("createCategory - Failed to create category", error as Error, {
      userUuid: input.userUuid,
    });
    if (error?.code === "P2002") {
      return fail("CONFLICT");
    }
    return fail("INTERNAL_ERROR");
  }
}

export async function updateCategory(
  input: CategoryUpdateInput
): Promise<
  ServiceResult<{ id: number; uuid: string }, "NOT_FOUND" | "CONFLICT" | "INTERNAL_ERROR">
> {
  try {
    const existing = await prisma.category.findFirst({
      where: { id: input.categoryId, userUuid: input.userUuid },
      select: { id: true },
    });
    if (!existing) {
      return fail("NOT_FOUND");
    }

    const category = await prisma.category.update({
      where: { id: input.categoryId },
      data: { name: input.name.trim() },
      select: { id: true, uuid: true },
    });

    return ok(category);
  } catch (error: any) {
    logger.error("updateCategory - Failed to update category", error as Error, {
      userUuid: input.userUuid,
      categoryId: input.categoryId,
    });
    if (error?.code === "P2002") {
      return fail("CONFLICT");
    }
    return fail("INTERNAL_ERROR");
  }
}

export async function deleteCategory(
  input: CategoryDeleteInput
): Promise<ServiceResult<{ id: number }, "NOT_FOUND" | "INTERNAL_ERROR">> {
  try {
    const existing = await prisma.category.findFirst({
      where: { id: input.categoryId, userUuid: input.userUuid },
      select: { id: true },
    });
    if (!existing) {
      return fail("NOT_FOUND");
    }

    await prisma.category.delete({ where: { id: input.categoryId } });
    return ok({ id: input.categoryId });
  } catch (error) {
    logger.error("deleteCategory - Failed to delete category", error as Error, {
      userUuid: input.userUuid,
      categoryId: input.categoryId,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function createSubcategory(
  input: SubcategoryWriteInput
): Promise<ServiceResult<{ id: number; uuid: string }, "NOT_FOUND" | "CONFLICT" | "INTERNAL_ERROR">> {
  try {
    const category = await prisma.category.findFirst({
      where: { id: input.categoryId, userUuid: input.userUuid },
      select: { id: true },
    });
    if (!category) {
      return fail("NOT_FOUND");
    }

    const subcategory = await prisma.subcategory.create({
      data: {
        userUuid: input.userUuid,
        categoryId: input.categoryId,
        name: input.name.trim(),
      },
      select: { id: true, uuid: true },
    });

    return ok(subcategory);
  } catch (error: any) {
    logger.error("createSubcategory - Failed to create subcategory", error as Error, {
      userUuid: input.userUuid,
      categoryId: input.categoryId,
    });
    if (error?.code === "P2002") {
      return fail("CONFLICT");
    }
    return fail("INTERNAL_ERROR");
  }
}

export async function updateSubcategory(
  input: SubcategoryUpdateInput
): Promise<
  ServiceResult<{ id: number; uuid: string }, "NOT_FOUND" | "CONFLICT" | "INTERNAL_ERROR">
> {
  try {
    const [subcategory, category] = await Promise.all([
      prisma.subcategory.findFirst({
        where: { id: input.subcategoryId, userUuid: input.userUuid },
        select: { id: true },
      }),
      prisma.category.findFirst({
        where: { id: input.categoryId, userUuid: input.userUuid },
        select: { id: true },
      }),
    ]);

    if (!subcategory || !category) {
      return fail("NOT_FOUND");
    }

    const updated = await prisma.subcategory.update({
      where: { id: input.subcategoryId },
      data: {
        categoryId: input.categoryId,
        name: input.name.trim(),
      },
      select: { id: true, uuid: true },
    });

    return ok(updated);
  } catch (error: any) {
    logger.error("updateSubcategory - Failed to update subcategory", error as Error, {
      userUuid: input.userUuid,
      subcategoryId: input.subcategoryId,
    });
    if (error?.code === "P2002") {
      return fail("CONFLICT");
    }
    return fail("INTERNAL_ERROR");
  }
}

export async function deleteSubcategory(
  input: SubcategoryDeleteInput
): Promise<ServiceResult<{ id: number }, "NOT_FOUND" | "INTERNAL_ERROR">> {
  try {
    const existing = await prisma.subcategory.findFirst({
      where: { id: input.subcategoryId, userUuid: input.userUuid },
      select: { id: true },
    });
    if (!existing) {
      return fail("NOT_FOUND");
    }

    await prisma.subcategory.delete({ where: { id: input.subcategoryId } });
    return ok({ id: input.subcategoryId });
  } catch (error) {
    logger.error("deleteSubcategory - Failed to delete subcategory", error as Error, {
      userUuid: input.userUuid,
      subcategoryId: input.subcategoryId,
    });
    return fail("INTERNAL_ERROR");
  }
}

import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

import { defaultCategories } from "./defaults";

export type CategoryDto = {
  id: number;
  uuid: string;
  name: string;
  subcategories: Array<{
    id: number;
    uuid: string;
    name: string;
  }>;
};

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
  userUuid: string
): Promise<ServiceResult<{ created: boolean }, "INTERNAL_ERROR">> {
  try {
    const existingCount = await prisma.category.count({
      where: { userUuid },
    });

    if (existingCount > 0) {
      return ok({ created: false });
    }

    for (const category of defaultCategories) {
      const createdCategory = await prisma.category.create({
        data: {
          userUuid,
          name: category.name,
        },
      });

      await prisma.subcategory.createMany({
        data: category.subcategories.map((name) => ({
          userUuid,
          categoryId: createdCategory.id,
          name,
        })),
      });
    }

    return ok({ created: true });
  } catch (error) {
    logger.error("ensureDefaultCategoriesForUser - Failed to seed categories", error as Error, {
      userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function listCategoriesForUser(
  userUuid: string
): Promise<ServiceResult<CategoryDto[], "INTERNAL_ERROR">> {
  try {
    const categories = await prisma.category.findMany({
      where: { userUuid },
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
      userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function resetCategoriesToDefault(
  userUuid: string
): Promise<ServiceResult<{ reset: true }, "INTERNAL_ERROR">> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.subcategory.deleteMany({ where: { userUuid } });
      await tx.category.deleteMany({ where: { userUuid } });

      for (const category of defaultCategories) {
        const createdCategory = await tx.category.create({
          data: {
            userUuid,
            name: category.name,
          },
        });

        await tx.subcategory.createMany({
          data: category.subcategories.map((name) => ({
            userUuid,
            categoryId: createdCategory.id,
            name,
          })),
        });
      }
    });

    return ok({ reset: true });
  } catch (error) {
    logger.error("resetCategoriesToDefault - Failed to reset categories", error as Error, {
      userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

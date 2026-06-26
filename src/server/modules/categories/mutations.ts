import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

export async function createCategory(
  userUuid: string,
  input: { name: string }
): Promise<ServiceResult<{ id: number; uuid: string }, "CONFLICT" | "INTERNAL_ERROR">> {
  try {
    const category = await prisma.category.create({
      data: {
        userUuid,
        name: input.name.trim(),
      },
      select: { id: true, uuid: true },
    });

    return ok(category);
  } catch (error: any) {
    logger.error("createCategory - Failed to create category", error as Error, { userUuid });
    if (error?.code === "P2002") {
      return fail("CONFLICT");
    }
    return fail("INTERNAL_ERROR");
  }
}

export async function updateCategory(
  userUuid: string,
  categoryId: number,
  input: { name: string }
): Promise<
  ServiceResult<{ id: number; uuid: string }, "NOT_FOUND" | "CONFLICT" | "INTERNAL_ERROR">
> {
  try {
    const existing = await prisma.category.findFirst({
      where: { id: categoryId, userUuid },
      select: { id: true },
    });
    if (!existing) {
      return fail("NOT_FOUND");
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { name: input.name.trim() },
      select: { id: true, uuid: true },
    });

    return ok(category);
  } catch (error: any) {
    logger.error("updateCategory - Failed to update category", error as Error, {
      userUuid,
      categoryId,
    });
    if (error?.code === "P2002") {
      return fail("CONFLICT");
    }
    return fail("INTERNAL_ERROR");
  }
}

export async function deleteCategory(
  userUuid: string,
  categoryId: number
): Promise<ServiceResult<{ id: number }, "NOT_FOUND" | "INTERNAL_ERROR">> {
  try {
    const existing = await prisma.category.findFirst({
      where: { id: categoryId, userUuid },
      select: { id: true },
    });
    if (!existing) {
      return fail("NOT_FOUND");
    }

    await prisma.category.delete({ where: { id: categoryId } });
    return ok({ id: categoryId });
  } catch (error) {
    logger.error("deleteCategory - Failed to delete category", error as Error, {
      userUuid,
      categoryId,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function createSubcategory(
  userUuid: string,
  input: { categoryId: number; name: string }
): Promise<ServiceResult<{ id: number; uuid: string }, "NOT_FOUND" | "CONFLICT" | "INTERNAL_ERROR">> {
  try {
    const category = await prisma.category.findFirst({
      where: { id: input.categoryId, userUuid },
      select: { id: true },
    });
    if (!category) {
      return fail("NOT_FOUND");
    }

    const subcategory = await prisma.subcategory.create({
      data: {
        userUuid,
        categoryId: input.categoryId,
        name: input.name.trim(),
      },
      select: { id: true, uuid: true },
    });

    return ok(subcategory);
  } catch (error: any) {
    logger.error("createSubcategory - Failed to create subcategory", error as Error, {
      userUuid,
      categoryId: input.categoryId,
    });
    if (error?.code === "P2002") {
      return fail("CONFLICT");
    }
    return fail("INTERNAL_ERROR");
  }
}

export async function updateSubcategory(
  userUuid: string,
  subcategoryId: number,
  input: { categoryId: number; name: string }
): Promise<
  ServiceResult<{ id: number; uuid: string }, "NOT_FOUND" | "CONFLICT" | "INTERNAL_ERROR">
> {
  try {
    const [subcategory, category] = await Promise.all([
      prisma.subcategory.findFirst({
        where: { id: subcategoryId, userUuid },
        select: { id: true },
      }),
      prisma.category.findFirst({
        where: { id: input.categoryId, userUuid },
        select: { id: true },
      }),
    ]);

    if (!subcategory || !category) {
      return fail("NOT_FOUND");
    }

    const updated = await prisma.subcategory.update({
      where: { id: subcategoryId },
      data: {
        categoryId: input.categoryId,
        name: input.name.trim(),
      },
      select: { id: true, uuid: true },
    });

    return ok(updated);
  } catch (error: any) {
    logger.error("updateSubcategory - Failed to update subcategory", error as Error, {
      userUuid,
      subcategoryId,
    });
    if (error?.code === "P2002") {
      return fail("CONFLICT");
    }
    return fail("INTERNAL_ERROR");
  }
}

export async function deleteSubcategory(
  userUuid: string,
  subcategoryId: number
): Promise<ServiceResult<{ id: number }, "NOT_FOUND" | "INTERNAL_ERROR">> {
  try {
    const existing = await prisma.subcategory.findFirst({
      where: { id: subcategoryId, userUuid },
      select: { id: true },
    });
    if (!existing) {
      return fail("NOT_FOUND");
    }

    await prisma.subcategory.delete({ where: { id: subcategoryId } });
    return ok({ id: subcategoryId });
  } catch (error) {
    logger.error("deleteSubcategory - Failed to delete subcategory", error as Error, {
      userUuid,
      subcategoryId,
    });
    return fail("INTERNAL_ERROR");
  }
}

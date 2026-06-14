jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: ((globalThis as any).__categoriesPrismaMock = {
    $transaction: jest.fn(),
    category: {
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    subcategory: {
      create: jest.fn(),
      createMany: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  }),
}));

import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  ensureDefaultCategoriesForUser,
  resetCategoriesToDefault,
  updateCategory,
  updateSubcategory,
} from "./service";
import { defaultCategories } from "./defaults";

const mockPrisma = (globalThis as any).__categoriesPrismaMock;
const mockTransactionClient = {
  category: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  subcategory: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe("category service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("seeds default categories only when a user has none", async () => {
    mockPrisma.category.count.mockResolvedValueOnce(1);
    await expect(
      ensureDefaultCategoriesForUser({ userUuid: "user-1" })
    ).resolves.toEqual({ ok: true, data: { created: false } });
    expect(mockPrisma.category.create).not.toHaveBeenCalled();

    mockPrisma.category.count.mockResolvedValueOnce(0);
    mockPrisma.category.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: data.name.length })
    );

    await expect(
      ensureDefaultCategoriesForUser({ userUuid: "user-1" })
    ).resolves.toEqual({ ok: true, data: { created: true } });

    expect(mockPrisma.category.create).toHaveBeenCalledTimes(defaultCategories.length);
    expect(mockPrisma.subcategory.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ userUuid: "user-1", name: expect.any(String) }),
      ]),
    });
  });

  it("maps category unique conflicts to CONFLICT and enforces ownership for updates/deletes", async () => {
    mockPrisma.category.create.mockRejectedValueOnce({ code: "P2002" });
    await expect(
      createCategory({ userUuid: "user-1", name: " Food " })
    ).resolves.toMatchObject({ ok: false, error: "CONFLICT" });

    mockPrisma.category.findFirst.mockResolvedValueOnce(null);
    await expect(
      updateCategory({ userUuid: "user-1", categoryId: 10, name: "Travel" })
    ).resolves.toMatchObject({ ok: false, error: "NOT_FOUND" });

    mockPrisma.category.findFirst.mockResolvedValueOnce(null);
    await expect(
      deleteCategory({ userUuid: "user-1", categoryId: 10 })
    ).resolves.toMatchObject({ ok: false, error: "NOT_FOUND" });
    expect(mockPrisma.category.delete).not.toHaveBeenCalled();
  });

  it("creates, moves, updates, and deletes only user-owned subcategories", async () => {
    mockPrisma.category.findFirst.mockResolvedValueOnce(null);
    await expect(
      createSubcategory({ userUuid: "user-1", categoryId: 10, name: "Dinner" })
    ).resolves.toMatchObject({ ok: false, error: "NOT_FOUND" });

    mockPrisma.subcategory.findFirst.mockResolvedValueOnce({ id: 20 });
    mockPrisma.category.findFirst.mockResolvedValueOnce(null);
    await expect(
      updateSubcategory({
        userUuid: "user-1",
        subcategoryId: 20,
        categoryId: 99,
        name: "Lunch",
      })
    ).resolves.toMatchObject({ ok: false, error: "NOT_FOUND" });

    mockPrisma.subcategory.findFirst.mockResolvedValueOnce(null);
    await expect(
      deleteSubcategory({ userUuid: "user-1", subcategoryId: 20 })
    ).resolves.toMatchObject({ ok: false, error: "NOT_FOUND" });
    expect(mockPrisma.subcategory.delete).not.toHaveBeenCalled();
  });

  it("resets categories inside a Prisma transaction", async () => {
    mockPrisma.$transaction.mockImplementation(async (callback) =>
      callback(mockTransactionClient)
    );
    mockTransactionClient.category.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: data.name.length })
    );

    await expect(
      resetCategoriesToDefault({ userUuid: "user-1" })
    ).resolves.toEqual({ ok: true, data: { reset: true } });

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockTransactionClient.subcategory.deleteMany).toHaveBeenCalledWith({
      where: { userUuid: "user-1" },
    });
    expect(mockTransactionClient.category.deleteMany).toHaveBeenCalledWith({
      where: { userUuid: "user-1" },
    });
    expect(mockTransactionClient.category.create).toHaveBeenCalledTimes(
      defaultCategories.length
    );
  });
});

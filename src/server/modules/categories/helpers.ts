import type { CategoryDto } from "@/server/modules/categories/service";

import type { CategoryOption, UserCategorySummary } from "@/common/types";

export function toCategoryOption(category: CategoryDto): CategoryOption {
  return {
    id: category.id,
    uuid: category.uuid,
    name: category.name,
    subcategories: category.subcategories.map((subcategory) => ({
      id: subcategory.id,
      uuid: subcategory.uuid,
      name: subcategory.name,
      categoryId: category.id,
    })),
  };
}

export function toUserCategorySummary(category: CategoryDto): UserCategorySummary {
  return {
    name: category.name,
    subcategories: category.subcategories.map((subcategory) => subcategory.name),
  };
}

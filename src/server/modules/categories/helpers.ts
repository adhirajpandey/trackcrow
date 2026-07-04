import type { CategoryDto } from "@/server/modules/categories/types";

import type { CategoryOption, UserCategorySummary } from "@/common/types";

export function toCategoryOption(category: CategoryDto): CategoryOption {
  return {
    uuid: category.uuid,
    name: category.name,
    subcategories: category.subcategories.map((subcategory) => ({
      uuid: subcategory.uuid,
      name: subcategory.name,
      categoryUuid: category.uuid,
    })),
  };
}

export function toUserCategorySummary(category: CategoryDto): UserCategorySummary {
  return {
    name: category.name,
    subcategories: category.subcategories.map((subcategory) => subcategory.name),
  };
}

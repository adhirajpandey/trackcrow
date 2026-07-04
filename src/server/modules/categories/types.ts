export type CategoryDto = {
  uuid: string;
  name: string;
  subcategories: Array<{
    uuid: string;
    name: string;
  }>;
};

export type CategoryListInput = {
  userUuid: string;
};

export type CategoryWriteInput = {
  userUuid: string;
  name: string;
};

export type CategoryUpdateInput = CategoryWriteInput & {
  categoryUuid: string;
};

export type CategoryDeleteInput = {
  userUuid: string;
  categoryUuid: string;
};

export type SubcategoryWriteInput = {
  userUuid: string;
  categoryUuid: string;
  name: string;
};

export type SubcategoryUpdateInput = SubcategoryWriteInput & {
  subcategoryUuid: string;
};

export type SubcategoryDeleteInput = {
  userUuid: string;
  subcategoryUuid: string;
};

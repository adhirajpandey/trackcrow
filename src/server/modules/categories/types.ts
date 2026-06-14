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

export type CategoryListInput = {
  userUuid: string;
};

export type CategoryWriteInput = {
  userUuid: string;
  name: string;
};

export type CategoryUpdateInput = CategoryWriteInput & {
  categoryId: number;
};

export type CategoryDeleteInput = {
  userUuid: string;
  categoryId: number;
};

export type SubcategoryWriteInput = {
  userUuid: string;
  categoryId: number;
  name: string;
};

export type SubcategoryUpdateInput = SubcategoryWriteInput & {
  subcategoryId: number;
};

export type SubcategoryDeleteInput = {
  userUuid: string;
  subcategoryId: number;
};

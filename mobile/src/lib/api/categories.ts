import { getJson, postJson, patchJson, deleteJson, type Credentials, type UuidResult } from './client';
export type Subcategory = { uuid: string; name: string; categoryUuid: string };
export type Category = { uuid: string; name: string; subcategories: Subcategory[] };
export const fetchCategories = (c: Credentials, signal?: AbortSignal) =>
  getJson<Category[]>(c, '/api/categories', signal);
export const createCategory = (c: Credentials, name: string) => postJson<UuidResult>(c, '/api/categories', { name });
export const updateCategory = (c: Credentials, id: string, name: string) =>
  patchJson<UuidResult>(c, `/api/categories/${encodeURIComponent(id)}`, { name });
export const deleteCategory = (c: Credentials, id: string) =>
  deleteJson<UuidResult>(c, `/api/categories/${encodeURIComponent(id)}`);
export const resetCategories = (c: Credentials) => postJson<{ reset: true }>(c, '/api/categories/reset-defaults', {});
export const createSubcategory = (c: Credentials, input: { name: string; categoryUuid: string }) =>
  postJson<UuidResult>(c, '/api/subcategories', input);
export const updateSubcategory = (c: Credentials, id: string, input: { name: string; categoryUuid: string }) =>
  patchJson<UuidResult>(c, `/api/subcategories/${encodeURIComponent(id)}`, input);
export const deleteSubcategory = (c: Credentials, id: string) =>
  deleteJson<UuidResult>(c, `/api/subcategories/${encodeURIComponent(id)}`);

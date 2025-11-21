export function getCategoryContextSection(categoriesContext: any[]) {
  return `
### 📂 CATEGORY CONTEXT
Below is the list of available categories and their subcategories.  
⚠️ **For identifying category and subcategory, stick strictly to this provided context.**  
Do not create or infer new categories beyond this list.

${JSON.stringify(categoriesContext, null, 2)}
`;
}

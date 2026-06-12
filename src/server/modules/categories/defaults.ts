export const defaultCategories = [
  { name: "Food", subcategories: ["Breakfast", "Lunch", "Dinner", "Snacks"] },
  {
    name: "Essentials",
    subcategories: ["Household", "Groceries", "Utilities", "Others"],
  },
  { name: "Transport", subcategories: ["Cab", "Auto", "Bike", "Others"] },
  { name: "Shopping", subcategories: ["Apparel", "Gadgets", "Gifts", "Others"] },
] as const;

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Your existing Next.js + TypeScript presets
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Add ignores here
  {
    ignores: [".next", "node_modules", "dist", "coverage", "src/generated"],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Temporarily disable for diagnosis
    },
  },
];

export default eslintConfig;

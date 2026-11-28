import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  { ignores: [".next/**", "node_modules/**", "coverage/**", "playwright-report/**", "test-results/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Project rule: Lucide icons are strictly prohibited. Use src/components/icons.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["lucide-react", "lucide-react/*", "lucide", "lucide/*", "@lucide/*"],
              message: "Lucide icons are prohibited. Use the custom SVG icons in src/components/icons.",
            },
          ],
        },
      ],
    },
  },
];

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import jsdoc from "eslint-plugin-jsdoc";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "blob-report"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      jsdoc.configs["flat/recommended-typescript-error"],
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      jsdoc,
    },
    rules: {
      // Focus on codebase documentation
      "jsdoc/require-jsdoc": [
        "error",
        {
          require: {
            FunctionDeclaration: true,
            ArrowFunctionExpression: true,
            ClassDeclaration: true,
          },
          // Only enforce on specific folders (hooks, utils, store) and ignore tests and React components
          contexts: [
            "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression",
            "ExportNamedDeclaration > FunctionDeclaration",
          ],
        },
      ],
      "jsdoc/require-param-type": "off", // TS handles types
      "jsdoc/require-returns-type": "off", // TS handles types
      "jsdoc/require-returns": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-param-description": "off",
      "jsdoc/require-yields": "off",
      "jsdoc/check-param-names": "off",
      "@typescript-eslint/no-explicit-any": "off", // Ignoring standard stuff for this refactor
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);

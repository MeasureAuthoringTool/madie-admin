import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**"],
  },
  ...compat.extends(
    "ts-react-important-stuff",
    "plugin:prettier/recommended"
  ),
  {
    languageOptions: {
      parser: (await import("@babel/eslint-parser")).default,
      parserOptions: {
        requireConfigFile: true,
      },
    },
  },
];


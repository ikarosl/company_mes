import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

const ignores = ['**/dist/**', '**/node_modules/**', '.* ', 'scripts/**'];

export default defineConfig(
  {
    ignores,
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended, eslintConfigPrettier],
    plugins: {
      prettier: eslintPluginPrettier,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
    },
    rules: {
      'no-var': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    ignores,
    files: [
      'apps/{admin-web,workstation-web}/**/*.{ts,js,tsx,jsx,vue}',
      'packages/ui/**/*.{ts,js,tsx,jsx,vue}',
    ],
    extends: [...eslintPluginVue.configs['flat/recommended'], eslintConfigPrettier],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    ignores,
    files: ['apps/backend/**/*.{ts,js}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);

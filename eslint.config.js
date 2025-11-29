const js = require('@eslint/js');
const globals = require('globals');
const reactHooks = require('eslint-plugin-react-hooks');
const reactRefresh = require('eslint-plugin-react-refresh');
const { defineConfig, globalIgnores } = require('eslint/config');

module.exports = defineConfig([
  globalIgnores(['dist', 'build']),

  // ============================================================
  // 🔹 1. FRONTEND (React + Vite)
  // ============================================================
  {
    files: ['src/**/*.{js,jsx}'],
    ignores: [
      'src/generated/**',
      'src/**/prisma/**',
    ],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },

  // ============================================================
  // 🔹 2. FRONTEND CONTEXTS / HOOKS (como GestionContext.jsx)
  //     Evita el error de Fast Refresh
  // ============================================================
  {
    files: [
      'src/**/*Context.{js,jsx}',
      'src/**/context/**/*.{js,jsx}',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // ============================================================
  // 🔹 3. BACKEND (Node + Express + Prisma + CommonJS)
  // ============================================================
  {
    files: ['api/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,   // habilita: require, module, process, __dirname…
        ...globals.commonjs,
      },
      sourceType: 'commonjs',
    },
    rules: {
      'no-unused-vars': 'off', // opcional
      'react-refresh/only-export-components': 'off', // por si acaso
    },
  },

  // ============================================================
  // 🔹 4. PRISMA CLIENT / GENERATED FILES (ignorar)
  // ============================================================
  {
    files: [
      'src/generated/**/*',
      'prisma/**/*.js',
    ],
    rules: {
      all: 'off',
    },
  },
]);

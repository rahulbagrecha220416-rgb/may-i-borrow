import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // android/ holds a copied production bundle (Capacitor sync output) — linting it
  // produced ~585 phantom errors. *.apk and node_modules for the same reason.
  globalIgnores(['dist', 'android', 'node_modules', '*.apk']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: { react },
    rules: {
      // Without jsx-uses-vars, ESLint's scope analysis cannot see `<motion.div>` as a
      // use of `motion`, so every lowercase JSX import was reported unused.
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      // Heuristic rule new in react-hooks 7. Our data-loading effects set a loading
      // flag before awaiting (the pattern React's own docs show); nothing cascades.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // Context files export the provider and its hook together on purpose.
    files: ['src/context/**/*.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['generate_icons.js', 'scripts/**/*.{js,mjs,cjs}'],
    languageOptions: { globals: { ...globals.node } },
  },
])

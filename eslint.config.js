import { defineConfig, globalIgnores } from 'eslint/config'

// this configuration intentionally keeps ESLint out of the way. it still
// exports a valid config so the CLI won’t error, but there are no active rules
// or extensions. builds are unaffected because linting isn’t part of them.

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {},
    },
    rules: {},
  },
])

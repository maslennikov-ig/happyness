module.exports = {
  root: true,
  // This tells ESLint to load the config from the package
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json', './src/frontend/tsconfig.json', './src/backend/tsconfig.json'],
  },
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    // Common rules
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'prettier/prettier': 'warn',
    
    // Add more specific rules as needed
  },
  overrides: [
    // Specific rules for frontend (Next.js)
    {
      files: ['src/frontend/**/*.ts', 'src/frontend/**/*.tsx'],
      extends: [
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:@next/next/recommended',
      ],
      plugins: ['react', 'react-hooks'],
      rules: {
        'react/react-in-jsx-scope': 'off', // Not needed in Next.js
        'react/prop-types': 'off', // We use TypeScript for prop validation
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
    },
    // Specific rules for backend (NestJS)
    {
      files: ['src/backend/**/*.ts'],
      plugins: ['nestjs'],
      extends: ['plugin:nestjs/recommended'],
      rules: {
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
        '@typescript-eslint/explicit-module-boundary-types': ['warn'],
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    'coverage/',
    '*.js',
    '!.eslintrc.js',
  ],
};

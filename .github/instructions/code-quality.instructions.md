# Code Quality & Standards Instructions

**Project:** YouTube Media Player - Code Quality Standards  
**Purpose:** Define code quality tools, linting rules, formatting standards, and TypeScript configuration  
**Scope:** ESLint, Prettier, TypeScript strict mode, code conventions

---

## 🎯 Core Principles

1. **Consistent Code Style** - Same formatting across all files
2. **Automated Quality Checks** - Catch issues before commit
3. **Type Safety** - Strict TypeScript for maximum safety
4. **Import Organization** - Consistent import ordering
5. **No Warnings in Production** - Fix all issues before merge

---

## 📦 Required Tools

```json
// package.json dependencies
{
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.50.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-import": "^2.28.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.0.0",
    "prettier-plugin-organize-imports": "^3.2.0"
  }
}
```

---

## 🔧 ESLint Configuration

### Backend `.eslintrc.js`

```javascript
// backend/.eslintrc.js
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier', // Must be last to override other configs
  ],
  rules: {
    // TypeScript specific
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/require-await': 'warn',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn',
    '@typescript-eslint/strict-boolean-expressions': 'off', // Too strict for practical use
    
    // Import ordering
    'import/order': ['error', {
      'groups': [
        'builtin',  // Node.js built-in modules
        'external', // External packages
        'internal', // Internal aliases
        'parent',   // Parent imports
        'sibling',  // Sibling imports
        'index',    // Index imports
      ],
      'newlines-between': 'always',
      'alphabetize': { order: 'asc', caseInsensitive: true },
    }],
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'error',
    'import/no-cycle': 'warn',
    
    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
};
```

### Frontend `.eslintrc.js`

```javascript
// frontend/.eslintrc.js
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'import',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime', // No need to import React in every file
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier', // Must be last
  ],
  rules: {
    // TypeScript
    '@typescript-eslint/explicit-function-return-type': 'off', // Too verbose for React components
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn',
    
    // React specific
    'react/prop-types': 'off', // Using TypeScript instead
    'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
    'react/jsx-uses-react': 'off',
    'react/jsx-key': 'error',
    'react/jsx-no-target-blank': 'error',
    'react/jsx-boolean-value': ['error', 'never'],
    'react/self-closing-comp': 'error',
    'react/jsx-curly-brace-presence': ['error', 'never'],
    'react/function-component-definition': ['error', {
      namedComponents: 'function-declaration',
      unnamedComponents: 'arrow-function',
    }],
    
    // React Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Import ordering
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index',
      ],
      'pathGroups': [
        {
          pattern: 'react',
          group: 'external',
          position: 'before',
        },
      ],
      'pathGroupsExcludedImportTypes': ['react'],
      'newlines-between': 'always',
      'alphabetize': { order: 'asc', caseInsensitive: true },
    }],
    
    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
};
```

---

## 🎨 Prettier Configuration

### `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "plugins": ["prettier-plugin-organize-imports"]
}
```

### `.prettierignore`

```
# Build outputs
dist/
build/
coverage/
*.tsbuildinfo

# Dependencies
node_modules/

# Generated files
prisma/migrations/

# Docker
.docker/

# Config
.env
.env.*
```

---

## 📝 TypeScript Strict Configuration

### Backend `tsconfig.json`

```json
{
  "compilerOptions": {
    // Language and Environment
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "commonjs",
    "moduleResolution": "node",
    
    // Strict Type-Checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    
    // Additional Checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    
    // Module Resolution
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    
    // Output
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    
    // Other
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowJs": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

### Frontend `tsconfig.json`

```json
{
  "compilerOptions": {
    // Language and Environment
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    
    // Strict Type-Checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    
    // Additional Checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    
    // Module Resolution
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    
    // Output
    "outDir": "./dist",
    "declaration": true,
    "sourceMap": true,
    
    // Vite-specific
    "useDefineForClassFields": true,
    "types": ["vite/client"],
    
    // Path Aliases
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@api/*": ["src/api/*"],
      "@stores/*": ["src/stores/*"]
    },
    
    // Other
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowJs": false
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.spec.tsx"]
}
```

---

## 📐 EditorConfig

### `.editorconfig`

```ini
# EditorConfig is awesome: https://EditorConfig.org

root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2

[Makefile]
indent_style = tab
```

---

## 🚀 NPM Scripts

### Backend `package.json` scripts

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "validate": "npm run lint && npm run format:check && npm run type-check"
  }
}
```

### Frontend `package.json` scripts

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx}\"",
    "type-check": "tsc --noEmit",
    "validate": "npm run lint && npm run format:check && npm run type-check"
  }
}
```

---

## 📋 Code Style Guidelines

### Import Ordering

```typescript
// ✅ CORRECT - Organized imports

// 1. Node.js built-ins
import fs from 'fs';
import path from 'path';

// 2. External packages
import express from 'express';
import { PrismaClient } from '@prisma/client';

// 3. Internal imports (shared)
import { API_ROUTES } from '@shared/constants/routes';
import { endpoints } from '@shared/constants/endpoints';

// 4. Internal imports (local)
import { MediaService } from './services/media.service';
import { logger } from './utils/logger';

// 5. Type imports (separate)
import type { Request, Response } from 'express';
import type { Media } from '@prisma/client';
```

### Function Declarations

```typescript
// ✅ CORRECT - Named functions for top-level
export function calculateDuration(start: number, end: number): number {
  return end - start;
}

// ✅ CORRECT - Arrow functions for callbacks
const mapped = items.map((item) => item.id);

// ✅ CORRECT - Explicit return types
export function getMedia(id: string): Promise<Media | null> {
  return prisma.media.findUnique({ where: { id } });
}

// ❌ WRONG - Implicit any
export function process(data) { // Error: Parameter 'data' implicitly has an 'any' type
  return data.value;
}
```

### Type Annotations

```typescript
// ✅ CORRECT - Explicit types for function parameters
function updateMedia(id: string, data: Partial<Media>): Promise<Media> {
  return mediaService.update(id, data);
}

// ✅ CORRECT - Interface for object shapes
interface CreateMediaDto {
  title: string;
  artist: string;
  album?: string;
  duration: number;
}

// ✅ CORRECT - Type for unions
type MediaStatus = 'pending' | 'downloading' | 'complete' | 'error';

// ❌ WRONG - Using 'any'
function process(data: any) { // Error: Don't use 'any'
  return data;
}
```

### Null/Undefined Handling

```typescript
// ✅ CORRECT - Optional chaining
const title = media?.title;

// ✅ CORRECT - Nullish coalescing
const artist = media?.artist ?? 'Unknown Artist';

// ✅ CORRECT - Type guards
if (media !== null && media !== undefined) {
  console.log(media.title);
}

// ❌ WRONG - Unchecked access
console.log(media.title); // Error if strict null checks enabled
```

---

## ✅ Pre-commit Validation

### Validate Before Commit

```bash
# Run all checks
npm run validate

# Fix auto-fixable issues
npm run lint:fix
npm run format

# Check again
npm run validate
```

### VSCode Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## 🎯 Code Quality Checklist

### Before Every Commit

- [ ] No ESLint errors
- [ ] No ESLint warnings (in production code)
- [ ] Code formatted with Prettier
- [ ] All imports organized
- [ ] No `any` types
- [ ] No `console.log` (use proper logging)
- [ ] No `debugger` statements
- [ ] TypeScript compiles without errors
- [ ] All files have consistent line endings

### During Code Review

- [ ] Follows project conventions
- [ ] Type-safe (no type assertions unless necessary)
- [ ] Proper error handling
- [ ] No unused variables or imports
- [ ] Functions have clear, descriptive names
- [ ] Complex logic is commented
- [ ] No magic numbers (use constants)

---

## 🚨 Common Issues & Fixes

### Issue: "Unsafe return of any typed value"

```typescript
// ❌ WRONG
function getData(key: string) {
  return data[key]; // Unsafe - could be any type
}

// ✅ CORRECT
function getData(key: string): string | undefined {
  return data[key] as string | undefined;
}

// ✅ BETTER - Use type guard
function getData(key: string): string | undefined {
  const value = data[key];
  return typeof value === 'string' ? value : undefined;
}
```

### Issue: "Promise returned in function not handled"

```typescript
// ❌ WRONG
function loadData() {
  fetchData(); // Floating promise
}

// ✅ CORRECT
async function loadData(): Promise<void> {
  await fetchData();
}

// ✅ CORRECT - Intentionally not awaited
function loadData(): void {
  void fetchData(); // Explicitly ignored
}
```

### Issue: "Argument of type X is not assignable to type Y"

```typescript
// ❌ WRONG
const media: Media = {
  title: 'Song',
  // Missing required fields
};

// ✅ CORRECT
const media: Media = {
  id: '123',
  title: 'Song',
  artist: 'Artist',
  duration: 240,
  filename: 'song.mp3',
  // All required fields
};
```

---

## 📚 Related Instructions

- **Architecture:** `.github/instructions/architecture.instructions.md`
- **Frontend:** `.github/instructions/frontend.instructions.md`
- **Backend:** `.github/instructions/backend.instructions.md`
- **Testing:** `.github/instructions/testing.instructions.md`
- **Git Workflow:** `.github/instructions/git-workflow.instructions.md`

---

**When to Reference:**
- ✅ Setting up new project
- ✅ Configuring IDE
- ✅ Before every commit
- ✅ During code review
- ✅ When encountering linting errors
- ✅ Onboarding new developers

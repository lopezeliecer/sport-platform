# Linting Configuration Guide

This document describes the linting and code formatting setup for the Sports Platform project.

## Overview

The project uses:

- **ESLint** - for code linting and static analysis
- **Prettier** - for automatic code formatting
- **Husky** - for Git hooks
- **lint-staged** - for running linters on staged files

## Configuration Files

### Root Configuration

- `.eslintrc.json` - Root ESLint configuration with TypeScript support
- `.prettierrc.json` - Root Prettier configuration
- `.prettierignore` - Files/directories to ignore during formatting
- `.husky/pre-commit` - Pre-commit hook configuration

### Service-Level Configuration

Each microservice has its own ESLint configuration that extends the root config:

- `apps/identity-service/.eslintrc.json`
- `apps/sports-service/.eslintrc.json`
- `apps/api-gateway/.eslintrc.json`
- `apps/club-management/.eslintrc.json`
- `apps/communication/.eslintrc.json`

## ESLint Rules

### TypeScript Rules

- **`@typescript-eslint/explicit-function-return-types`** (warn) - Require explicit return types on functions
- **`@typescript-eslint/no-explicit-any`** (warn) - Warn about usage of `any` type
- **`@typescript-eslint/no-unused-vars`** (error) - Error on unused variables (allows `_` prefix)
- **`@typescript-eslint/no-floating-promises`** (error) - Error on unawaited promises
- **`@typescript-eslint/no-misused-promises`** (error) - Error on promise misuse in conditionals
- **`@typescript-eslint/await-thenable`** (error) - Error on await of non-promise values
- **`@typescript-eslint/require-await`** (warn) - Warn on async functions without await

### Code Style Rules

- **`semi`** (error) - Require semicolons
- **`indent`** (error) - Enforce 2-space indentation
- **`eqeqeq`** (error) - Require `===` and `!==`
- **`no-var`** (error) - Disallow `var` usage
- **`prefer-const`** (error) - Prefer `const` over `let`
- **`no-console`** (warn) - Warn on console usage except warn/error
- **`no-debugger`** (error) - Disallow debugger statements
- **`curly`** (error) - Require curly braces for control statements

## Prettier Configuration

The `.prettierrc.json` enforces:

- Single quotes (except JSX)
- 100 character line width
- 2-space indentation
- Trailing commas for all multiline structures
- Semicolons
- LF line endings
- Bracket spacing in objects

## Usage

### Running Linters

```bash
# Check for linting issues (all workspaces)
npm run lint:check

# Fix linting issues (all workspaces)
npm run lint:fix

# Check for linting issues in root-level files
npm run lint:check

# Fix root-level linting issues
npm run lint:fix
```

### Running Formatters

```bash
# Format all files (all workspaces)
npm run format

# Check formatting without changes (all workspaces)
npm run format:check

# Format root-level files
npm run format:root

# Check root-level formatting
npm run format:check:root
```

### Individual Service Commands

```bash
# In a specific service directory (e.g., apps/identity-service)
npm run lint           # Fix issues
npm run lint:check     # Check without fixing
npm run format         # Format files
npm run format:check   # Check formatting
```

## Pre-commit Hooks

The project uses Husky and lint-staged to automatically run linting and formatting on staged files before commits.

### What Happens on Commit

1. Git hook triggers pre-commit hook (`.husky/pre-commit`)
2. lint-staged runs linting and formatting on staged files:
   - TypeScript files: ESLint + Prettier
   - JavaScript files: ESLint + Prettier
   - JSON files: Prettier
   - Markdown files: Prettier

### Bypassing Pre-commit Hooks

If you need to bypass the pre-commit hooks (not recommended):

```bash
git commit --no-verify
```

## IDE Integration

### VS Code Configuration

The project includes VS Code settings for ESLint and Prettier integration. Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit"
    },
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": ["typescript", "typescriptreact"],
  "eslint.alwaysShowStatus": true,
  "files.exclude": {
    "**/node_modules": true
  }
}
```

Install VS Code extensions:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## CI/CD Integration

These commands should be run in your CI/CD pipeline:

```bash
# Type checking
npm run type-check:all

# Linting
npm run lint:check

# Formatting verification
npm run format:check:root
```

## Common Issues

### ESLint Performance

If ESLint is slow, check:

1. Project structure in `parserOptions.project`
2. Number of files being linted
3. TypeScript version compatibility

### Prettier vs ESLint Conflicts

ESLint is configured to use the `prettier` plugin which automatically integrates with Prettier rules. Conflicts should be minimal.

### Workspace Linting

Ensure each workspace has proper `tsconfig.json` path in its `.eslintrc.json` for accurate type checking.

## Further Customization

To customize ESLint or Prettier rules:

1. Update `.eslintrc.json` (root) or service-level configs
2. Update `.prettierrc.json` for Prettier options
3. Restart your IDE/editor for changes to take effect
4. Run `npm run lint:fix` and `npm run format:root` to apply changes

## Related Documentation

- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)
- [@typescript-eslint Documentation](https://typescript-eslint.io/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)

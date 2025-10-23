# Developer Commit Workflow Guide

## Overview

The Sports Platform uses a **developer-friendly** pre-commit validation system that:

- ✅ **Never blocks** developers from committing
- 📋 **Shows all issues** before commit (errors and warnings)
- 🤔 **Asks for confirmation** if issues are found
- 🔧 **Offers auto-fix option** to resolve issues automatically

## The Pre-Commit Flow

When you run `git commit`, the following happens:

### 1. Validation Script Runs

The validation script checks staged files for:

- **ESLint issues** (code quality, style)
- **Formatting issues** (Prettier compliance)
- **TypeScript errors** (type safety)

### 2. Results Displayed

You'll see a summary of all issues found (if any):

```
📊 Validation Summary
════════════════════════════════════════════════════
✗ Found 3 error(s)
⚠ Found 2 warning(s)
```

### 3. Developer Choice

If issues are found, you have **three options**:

#### Option 1: Commit Anyway ✅

```
[1] Proceed with commit anyway (I'll fix later)
```

- **Use when:** You want to commit and fix issues later
- **Result:** Commit proceeds, but CI/CD may catch issues
- **Note:** Pipeline might fail - better to choose option 3

#### Option 2: Cancel and Fix 🛑

```
[2] Cancel commit (let me fix the issues)
```

- **Use when:** You want to fix issues now
- **Result:** Commit is cancelled, gives you commands to fix issues
- **Commands displayed:**
  ```bash
  npm run lint:fix          # Fix ESLint issues
  npm run format:root       # Fix formatting
  npm run type-check:all    # Check types
  ```

#### Option 3: Auto-Fix and Retry 🔧

```
[3] Run auto-fix formatter and retry validation
```

- **Use when:** You want automatic fixes
- **Result:**
  - Auto-fixes applied
  - Files re-staged
  - Validation runs again
  - If all pass, commit proceeds automatically
  - If issues remain, you choose again

## Common Workflows

### Workflow 1: Quick Commit (I'll fix later)

```bash
git add .
git commit -m "Add new feature"
# → Validation runs
# → Choose option [1]
# → Commit succeeds
# → You'll fix in next PR review
```

### Workflow 2: Clean Commit (Fix now)

```bash
git add .
git commit -m "Add new feature"
# → Validation runs
# → Choose option [2] to cancel
# → Run suggested commands
npm run lint:fix
npm run format:root
# → Re-stage and commit
git add .
git commit -m "Add new feature"
# → Validation runs again
# → All pass ✓
# → Commit succeeds
```

### Workflow 3: Smart Commit (Auto-fix)

```bash
git add .
git commit -m "Add new feature"
# → Validation runs
# → Choose option [3]
# → Script auto-fixes issues
# → Files re-staged
# → Validation runs again
# → All pass ✓
# → Commit proceeds automatically
```

## Bypass Pre-Commit Hook (Emergency Only)

If you absolutely must bypass the validation:

```bash
git commit --no-verify -m "Emergency commit"
```

⚠️ **WARNING:** Use only for emergencies! Your code will still be caught in CI/CD.

## Manual Validation Commands

You can run validation commands manually anytime:

```bash
# Check for ESLint issues (don't fix)
npm run lint:check

# Fix ESLint issues automatically
npm run lint:fix

# Check formatting (don't fix)
npm run format:check:root

# Fix formatting automatically
npm run format:root

# Run TypeScript type checking
npm run type-check:all

# Run full validation (all checks)
./scripts/validate-commit.sh
```

## What Gets Validated

### ESLint Checks

- Code quality rules
- TypeScript best practices
- Unused variables/imports
- Code style consistency

### Formatting Checks

- Single vs double quotes
- Trailing commas
- Line length (100 characters)
- Indentation (2 spaces)
- Semicolons

### TypeScript Checks

- Type safety
- Missing type annotations
- Type compatibility

## Fixing Common Issues

### Issue: Single vs Double Quotes

**Error:** `Replace "string" with 'string'`
**Fix:** Run `npm run format:root` (auto-fixes)

### Issue: Unused Variables

**Error:** `'variable' is defined but never used`
**Fix:** Remove the variable or prefix with underscore if intentionally unused: `_variable`

### Issue: Line Too Long

**Error:** `Line too long`
**Fix:** Run `npm run format:root` (auto-fixes via line wrapping)

### Issue: TypeScript Type Error

**Error:** `Unsafe member access on any value`
**Fix:** Add proper type annotations or cast the value

### Issue: Missing Await

**Warning:** `Missing await in async function`
**Fix:** Add `await` before the promise or remove `async` if not needed

## IDE Integration

To make this even smoother, configure your editor:

### VS Code

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

This automatically fixes issues when you save files.

## Understanding the Philosophy

This approach follows these principles:

1. **Developer Trust** - We trust developers to make good decisions
2. **No Force** - Never block commits; always provide choice
3. **Education** - Show issues so developers learn
4. **Convenience** - Offer automatic fixes when possible
5. **Safety** - CI/CD pipeline is the ultimate gatekeeper

## What Happens in CI/CD

Even if you commit with issues, the CI/CD pipeline will:

1. Run all linting and type checks
2. Block merge if issues fail
3. Require fixes before PR can be merged

So issues caught by the pre-commit hook will eventually need fixing anyway!

## Tips & Best Practices

✅ **Do:**

- Use option [3] (auto-fix) for quick cleaning
- Run `npm run format:root` regularly
- Fix TypeScript errors early (harder to refactor later)
- Commit frequently with small, focused changes

❌ **Don't:**

- Use `--no-verify` routinely
- Ignore TypeScript errors
- Commit large batches with formatting issues
- Mix code changes with large formatting changes

## Troubleshooting

### Pre-commit hook not running

```bash
# Ensure hook is executable
chmod +x .husky/pre-commit
chmod +x scripts/validate-commit.sh

# Re-install Husky
npx husky install
```

### Hook runs but my changes aren't validated

```bash
# Ensure files are staged
git add .  # Stage all changes first
git commit -m "message"
```

### Auto-fix option (3) doesn't work

```bash
# Run manual fix commands
npm run lint:fix
npm run format:root
npm run type-check:all

# Re-stage and commit
git add .
git commit -m "message"
```

## Questions?

See `LINTING_GUIDE.md` for detailed linting configuration information.

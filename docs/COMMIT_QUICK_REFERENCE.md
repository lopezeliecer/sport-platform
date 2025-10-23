# Pre-Commit Workflow Setup & Usage

## Quick Reference

### When You Try to Commit

```bash
git commit -m "Your message"
```

You'll see this menu:

```
⚠ You have validation issues before committing
════════════════════════════════════════════════════

Options:
  [1] Proceed with commit anyway (I'll fix later)
  [2] Cancel commit (let me fix the issues)
  [3] Run auto-fix formatter and retry validation

Enter choice [1-3]:
```

### The Three Choices

| Choice  | Action                     | When to Use                                     |
| ------- | -------------------------- | ----------------------------------------------- |
| **[1]** | Commit anyway              | Time-sensitive commits; CI/CD will catch issues |
| **[2]** | Cancel & show fix commands | Want to fix now; script shows what to run       |
| **[3]** | Auto-fix & retry           | Let script fix formatting/style automatically   |

## Examples

### Example 1: Quick Commit

```bash
$ git commit -m "Add user feature"
# → Validation finds 3 issues
# → Choose [1]
# → Commit succeeds ✓
# → Fix issues in next commit
```

### Example 2: Fix Now

```bash
$ git commit -m "Add user feature"
# → Validation finds 3 issues
# → Choose [2]
# → Commit cancelled ✗
# → Script shows commands:
npm run lint:fix
npm run format:root
# → You run them, then:
$ git add .
$ git commit -m "Add user feature"
# → Validation passes ✓
# → Commit succeeds ✓
```

### Example 3: Auto-Fix

```bash
$ git commit -m "Add user feature"
# → Validation finds 3 issues
# → Choose [3]
# → Script auto-fixes ✓
# → Files re-staged ✓
# → Validation re-runs ✓
# → Commit succeeds ✓
# → Done in seconds!
```

## What Gets Checked

### ✓ ESLint

- Code quality
- Unused imports
- Best practices
- Style consistency

### ✓ Prettier

- Quote style (single quotes)
- Line length (max 100 chars)
- Indentation (2 spaces)
- Semicolons
- Trailing commas

### ✓ TypeScript

- Type safety
- Type annotations
- Missing types

## Manual Validation

Run anytime without committing:

```bash
# Check all issues (show only)
./scripts/validate-commit.sh

# Check ESLint (show only)
npm run lint:check

# Fix ESLint issues
npm run lint:fix

# Check formatting (show only)
npm run format:check:root

# Fix formatting
npm run format:root

# Check TypeScript
npm run type-check:all
```

## Bypass Hook (Emergency)

Only if absolutely necessary:

```bash
git commit --no-verify -m "Emergency commit"
```

⚠️ Issues will still be caught in CI/CD pipeline!

## Setup Verification

Ensure everything is working:

```bash
# Make hook executable
chmod +x .husky/pre-commit
chmod +x scripts/validate-commit.sh

# Test it (make a small change, try to commit)
echo "test" >> test.txt
git add test.txt
git commit -m "test"
# → Should see validation menu
# → Choose [2] to cancel
git checkout -- test.txt
```

## Troubleshooting

### "Pre-commit hook not running"

```bash
chmod +x .husky/pre-commit
chmod +x scripts/validate-commit.sh
npx husky install
```

### "Command not found in validation script"

```bash
# Ensure you're in project root
cd /path/to/sports-platform

# Try manual validation
./scripts/validate-commit.sh
```

### "Auto-fix didn't work"

```bash
# Run commands manually
npm run lint:fix
npm run format:root
npm run type-check:all

# Then stage and commit
git add .
git commit -m "message"
```

## Philosophy

✅ **We believe:**

- Developers should NEVER be blocked from committing
- Issues should be visible for learning
- Automatic fixes are a convenience, not a requirement
- CI/CD pipeline is the ultimate gatekeeper

❌ **We don't:**

- Force developers to fix before commit
- Prevent commits for any reason
- Hide issues from developers
- Surprise developers in CI/CD

## File Locations

- **Validation Script**: `scripts/validate-commit.sh`
- **Husky Hook**: `.husky/pre-commit`
- **Full Documentation**: `docs/DEVELOPER_COMMIT_WORKFLOW.md`
- **Linting Config**: `docs/LINTING_GUIDE.md`

## Need Help?

1. See [`docs/DEVELOPER_COMMIT_WORKFLOW.md`](DEVELOPER_COMMIT_WORKFLOW.md) for detailed workflows
2. See [`docs/LINTING_GUIDE.md`](LINTING_GUIDE.md) for linting details
3. Run `./scripts/validate-commit.sh --help` (if supported)

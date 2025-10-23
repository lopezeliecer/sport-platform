# Pre-Commit Workflow Diagram

## The Flow Chart

```
┌─────────────────────────────────────────────────────┐
│ Developer runs: git commit -m "message"             │
└────────────────────┬────────────────────────────────┘
                     ↓
        ┌────────────────────────────┐
        │ Husky pre-commit hook runs │
        └────────────────┬───────────┘
                         ↓
        ┌────────────────────────────────┐
        │ validate-commit.sh executes    │
        └────────────────┬───────────────┘
                         ↓
        ┌─────────────────────────────────────────────┐
        │ 1. Get staged files                         │
        │ 2. Run ESLint checks                        │
        │ 3. Run Prettier formatting check            │
        │ 4. Run TypeScript type check                │
        └────────────┬──────────────────────────────┘
                     ↓
                ┌────────────────┐
                │ All pass? ✓    │
                └────────┬───────┘
                    ┌───┴────┬──────────────────┐
                    │        │                  │
                   YES      NO         ┌────────┴────────────┐
                    │        │         │ Validation Menu:   │
                    │        │         │ [1] Commit anyway  │
                    │        │         │ [2] Cancel & fix   │
                    │        │         │ [3] Auto-fix       │
                    │        │         └────────┬───────────┘
                    │        └──────────────────┤
                    │                           ↓
                    │                ┌──────────────────────┐
                    │                │ User chooses 1-3     │
                    │                └──┬───┬───┬──────────┘
                    │                   │   │   │
                    │         ┌─────────┘   │   └──────────────┐
                    │         ↓             ↓                  ↓
                    │    ┌─────────┐  ┌──────────┐  ┌──────────────────┐
                    │    │Option 1 │  │Option 2  │  │   Option 3       │
                    │    │Proceed  │  │ Cancel   │  │  Auto-fix        │
                    │    │anyway   │  │ & fix    │  │  & retry         │
                    │    └────┬────┘  └────┬─────┘  └────────┬────────┘
                    │         ↓            ↓                 ↓
                    │      ┌──────────┐ ┌───────┐ ┌─────────────────┐
                    │      │ Continue │ │Cancel │ │ Run formatter   │
                    │      │ commit   │ │commit │ │ Re-stage files  │
                    │      │ ✓        │ │ ✗     │ │ Retry validation│
                    │      └────┬─────┘ └───┬───┘ └────────┬────────┘
                    │           ↓           ↓              ↓
                    └───────────┼───────────┼──────────────┘
                                ↓           ↓
                    ┌──────────────────────────────────┐
                    │ All checks pass?                 │
                    └────────────┬─────────────────┬──┘
                            ┌───┴────────────────┴──┐
                            │ YES                   │ NO
                            ↓                       ↓
                    ┌──────────────────┐   ┌────────────────┐
                    │ Commit succeeds  │   │ Show menu again│
                    │ ✓ 🎉             │   │ Developer      │
                    │                  │   │ chooses 1-3    │
                    └──────────────────┘   └────────────────┘
                                                    ↑
                                                    │
                                            (Loop until pass)
```

## Three Paths Explained

### Path 1: "I'm in a Hurry - Commit Anyway"

```
┌─ Developer Choose [1]
├─ "I'll fix issues later"
├─ Commit proceeds immediately
├─ Issues still in codebase
└─ CI/CD will catch them later
```

### Path 2: "Let Me Fix This Now"

```
┌─ Developer Choose [2]
├─ Commit cancelled
├─ Script shows commands to run:
│   ├─ npm run lint:fix
│   ├─ npm run format:root
│   └─ npm run type-check:all
├─ Developer fixes issues
├─ git add . && git commit again
├─ Validation runs again
└─ Commit succeeds ✓
```

### Path 3: "Fix It Automatically"

```
┌─ Developer Choose [3]
├─ Script runs auto-fix:
│   ├─ npm run lint:fix (in background)
│   ├─ npm run format:root (in background)
│   └─ Re-stages files
├─ Validation runs again
├─ If all pass → Commit succeeds ✓
└─ If issues remain → Show menu again
```

## Decision Tree

```
Ready to commit?
    ↓
    └─→ Are you in a hurry?
            ├─→ YES (but issues exist)
            │   ├─→ Run with --no-verify?
            │   │   ├─→ YES → Skip hook entirely
            │   │   └─→ NO → Choose [1] (Proceed anyway)
            │   └─→ Either way: Commit succeeds, CI may fail later
            │
            └─→ NO (time to fix)
                ├─→ Want to fix manually?
                │   ├─→ YES → Choose [2] (Cancel & fix)
                │   └─→ NO → Choose [3] (Auto-fix)
                │
                └─→ After fix: Commit succeeds ✓
```

## Command Flow During Validation

### When Validation Runs:

```bash
$ git commit -m "Add feature"
            ↓
    ./scripts/validate-commit.sh
            ↓
    ┌───────┴────────────┬──────────────┬──────────────┐
    ↓                    ↓              ↓              ↓
  ESLint            Prettier        TypeScript       Summary
  on .ts/.js        on all files     type check       Report
  files                              all files
    ├─→ Results     ├─→ Results      ├─→ Results     ├─→ Pass/Fail
    └─→ Errors      └─→ Issues       └─→ Errors      └─→ Menu if failed
```

### Fixing Flow (Choice 3):

```bash
$ git commit -m "Add feature"
            ↓
    Issues detected → Choose [3]
            ↓
    ┌───────┴───────┬────────┐
    ↓               ↓        ↓
  ESLint fix    Prettier   Re-stage
  (--fix)       format     files
    ├─→ ✓ done  ├─→ ✓ done └─→ ✓ done
    └────────────┴──────────────┘
                 ↓
    Re-run validation
                 ↓
            All pass?
                 ↓
         YES → Commit ✓
         NO → Show menu again
```

## Time Comparison

### Path 1 (Quick Commit)

```
Total time: ~2 seconds
  ├─ Validation: 1s
  ├─ Choose [1]: 1s
  └─ Commit: instant
```

### Path 2 (Manual Fix)

```
Total time: ~5-10 minutes
  ├─ Validation: 1s
  ├─ Choose [2]: 1s
  ├─ Manual fixing: 5-10 min
  ├─ git add: instant
  ├─ Commit: 1s
  └─ Re-validation: 1s
```

### Path 3 (Auto-Fix)

```
Total time: ~5-10 seconds
  ├─ Validation: 1s
  ├─ Choose [3]: instant
  ├─ Auto-fix: 2-5s
  ├─ Re-stage: instant
  ├─ Re-validation: 1s
  └─ Commit: instant
```

## File Interactions

```
Git Repository
    ↓
.git/hooks/pre-commit (Husky hook)
    ↓
scripts/validate-commit.sh (Main script)
    ↓
    ├─→ npm run lint:check (ESLint)
    │       ├─ Uses: .eslintrc.json
    │       └─ Checks: *.ts, *.js
    │
    ├─→ npm run format:check:root (Prettier)
    │       ├─ Uses: .prettierrc.json
    │       ├─ Ignores: .prettierignore
    │       └─ Checks: *.ts, *.js, *.json, *.md
    │
    └─→ npm run type-check:all (TypeScript)
            ├─ Uses: tsconfig.json
            └─ Checks: All TS files
```

## Status Indicators

```
During Validation:
├─ 🔍 Checking  → In progress
├─ ✓ Passed    → Good
├─ ✗ Failed    → Issues found
├─ ⚠ Warning   → Non-blocking issue
└─ 🎉 Success  → Ready to commit

In Menu:
├─ [1] Green    → Recommended if urgent
├─ [2] Yellow   → Recommended if careful
└─ [3] Blue     → Recommended for quick cleanup
```

## When Validation SKIPS

```
No staged files → Skip validation
        ↓
    Only images/videos → Skip validation
        ↓
    Only .gitignore → Skip validation
        ↓
    Only non-code files → Skip validation
```

## Emergency Bypass

```
Developer needs to commit NOW:
        ↓
git commit --no-verify
        ↓
Skip Husky hook entirely
        ↓
Commit proceeds
        ↓
⚠️ Issues still in repo
        ↓
CI/CD will catch them
```

## Integration Points

```
                    Developer's IDE
                         ↓
                  (Optional: format on save)
                         ↓
                    Terminal: git commit
                         ↓
                    Pre-commit hook (Husky)
                         ↓
                 Validation script runs
                         ↓
            Checks code quality & formatting
                         ↓
                 Developer makes choice
                         ↓
              Commit succeeds or fails
                         ↓
                 Push to repository
                         ↓
                      CI/CD Pipeline
                    (Final validation)
```

This workflow ensures code quality while respecting developer autonomy!

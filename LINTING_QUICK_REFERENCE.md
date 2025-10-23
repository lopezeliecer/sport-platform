# Linting Quick Reference

## Most Common Commands

```bash
# Check for linting issues
npm run lint:check

# Fix linting issues automatically
npm run lint:fix

# Format all code
npm run format:root

# Check formatting without making changes
npm run format:check:root

# Check types
npm run type-check:all
```

## For Individual Services

```bash
cd apps/identity-service  # or any service directory

# Check issues
npm run lint:check

# Fix issues
npm run lint

# Format code
npm run format
```

## ESLint Common Issues

| Issue                | Fix                                                  |
| -------------------- | ---------------------------------------------------- |
| Unused variables     | Remove variable or prefix with `_` (e.g., `_unused`) |
| Unexpected `any`     | Replace with specific type                           |
| Missing return type  | Add `: ReturnType` to function                       |
| Trailing commas      | Prettier will add automatically                      |
| Double quotes        | Prettier will convert to single quotes               |
| Multiple blank lines | Prettier will normalize to single                    |

## Before Committing

```bash
# Run all checks
npm run lint:check        # Check ESLint
npm run format:check:root # Check Prettier
npm run type-check:all    # Check TypeScript

# Or auto-fix everything
npm run lint:fix          # Fix ESLint issues
npm run format:root       # Format all files
```

## VS Code Tips

1. **Enable Auto-Fix on Save**: Already configured in `.vscode/settings.json`
   - Save a file → ESLint fixes apply → Prettier formats

2. **View Problems**: `Ctrl+Shift+M` to open Problems panel

3. **Quick Fix**: `Ctrl+.` on an error for quick fixes

4. **Format Document**: `Shift+Alt+F` to manually format

5. **Disable Rules Locally**: Add comment above code:
   ```typescript
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const value: any = data;
   ```

## Bypassing Pre-commit Hooks (Not Recommended)

```bash
git commit --no-verify
```

## Performance Tips

- Run `npm run lint:fix` before committing large changes
- Use `npm run lint:check` first to see issues without waiting for fixes
- Keep `.eslintignore` updated for generated files

## Troubleshooting

**"ESLint parsing errors"**

- Clear node_modules: `rm -rf node_modules && npm install`
- Rebuild: `npm run build`

**"Different results in IDE vs CLI"**

- Restart VS Code
- Check `.vscode/settings.json` is properly formatted

**"Prettier conflicts with ESLint"**

- This should not happen (already configured)
- Clear ESLint cache: `npx eslint --cache --fix .`

## Documentation

For detailed configuration and rules, see:

- `docs/LINTING_GUIDE.md` - Complete linting guide
- `LINTING_SETUP.md` - Setup summary and status

#!/bin/bash

# Pre-commit validation script
# This script validates staged files before commit
# Shows errors and warnings, but doesn't block commit
# Gives developer the choice to proceed or fix issues

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track if issues were found
ERRORS_FOUND=0
WARNINGS_FOUND=0
LINT_OUTPUT=""

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📋 Pre-Commit Validation${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|js|json|md)$' || true)

if [ -z "$STAGED_FILES" ]; then
  echo -e "${GREEN}✓ No relevant files to validate${NC}"
  exit 0
fi

echo -e "\n${BLUE}📁 Staged files:${NC}"
echo "$STAGED_FILES" | sed 's/^/  /'

# Check for TypeScript/JavaScript files
TS_FILES=$(echo "$STAGED_FILES" | grep -E '\.(ts|js)$' || true)

if [ ! -z "$TS_FILES" ]; then
  echo -e "\n${BLUE}🔍 Running ESLint...${NC}"
  
  if npm run lint:check -- $TS_FILES 2>&1 | tee /tmp/lint-output.txt; then
    echo -e "${GREEN}✓ ESLint passed${NC}"
  else
    ERRORS_FOUND=$((ERRORS_FOUND + 1))
    LINT_OUTPUT=$(cat /tmp/lint-output.txt)
    echo -e "${RED}✗ ESLint found issues${NC}"
  fi
fi

# Check formatting
if [ ! -z "$STAGED_FILES" ]; then
  echo -e "\n${BLUE}🎨 Checking code formatting...${NC}"
  
  if npm run format:check:root -- $STAGED_FILES 2>&1 | tee /tmp/format-output.txt; then
    echo -e "${GREEN}✓ Formatting check passed${NC}"
  else
    WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
    echo -e "${YELLOW}⚠ Formatting issues found${NC}"
    echo -e "${YELLOW}(You can run 'npm run format:root' to auto-fix)${NC}"
  fi
fi

# TypeScript type checking for TS files
if [ ! -z "$TS_FILES" ]; then
  echo -e "\n${BLUE}🔬 Running TypeScript type check...${NC}"
  
  if npm run type-check:all 2>&1 | tee /tmp/type-output.txt | grep -q "error TS"; then
    ERRORS_FOUND=$((ERRORS_FOUND + 1))
    echo -e "${RED}✗ TypeScript type errors found${NC}"
  else
    echo -e "${GREEN}✓ TypeScript types OK${NC}"
  fi
fi

# Summary
echo -e "\n${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Validation Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"

if [ $ERRORS_FOUND -eq 0 ] && [ $WARNINGS_FOUND -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC}"
  echo -e "\n${BLUE}Proceeding with commit...${NC}"
  exit 0
fi

if [ $ERRORS_FOUND -gt 0 ]; then
  echo -e "${RED}✗ Found $ERRORS_FOUND error(s)${NC}"
fi

if [ $WARNINGS_FOUND -gt 0 ]; then
  echo -e "${YELLOW}⚠ Found $WARNINGS_FOUND warning(s)${NC}"
fi

# Show lint output if there were errors
if [ ! -z "$LINT_OUTPUT" ]; then
  echo -e "\n${RED}Lint Issues:${NC}"
  echo "$LINT_OUTPUT" | head -30
  echo -e "${YELLOW}(showing first 30 lines - see full output above)${NC}"
fi

# Ask developer if they want to proceed
echo -e "\n${YELLOW}════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}⚠ You have validation issues before committing${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Options:"
echo -e "  ${GREEN}[1]${NC} Proceed with commit anyway (I'll fix later)"
echo -e "  ${YELLOW}[2]${NC} Cancel commit (let me fix the issues)"
echo -e "  ${BLUE}[3]${NC} Run auto-fix formatter and retry validation"
echo ""

read -p "$(echo -e ${BLUE}Enter choice [1-3]:${NC}) " choice

case $choice in
  1)
    echo -e "\n${YELLOW}⚠ Proceeding with commit despite validation issues${NC}"
    echo -e "${YELLOW}Note: These issues may cause CI/CD pipeline failures${NC}"
    exit 0
    ;;
  2)
    echo -e "\n${RED}✗ Commit cancelled${NC}"
    echo -e "\n${BLUE}To fix issues:${NC}"
    echo -e "  npm run lint:fix          # Fix ESLint issues"
    echo -e "  npm run format:root       # Fix formatting"
    echo -e "  npm run type-check:all    # Check types"
    echo ""
    exit 1
    ;;
  3)
    echo -e "\n${BLUE}Running auto-formatter...${NC}"
    npm run format:root --silent
    npm run lint:fix --silent
    echo -e "${GREEN}✓ Auto-fix completed${NC}"
    echo -e "\n${BLUE}Re-staging files...${NC}"
    git add $STAGED_FILES
    echo -e "${GREEN}✓ Files re-staged${NC}"
    echo -e "\n${BLUE}Running validation again...${NC}"
    exec "$0"
    ;;
  *)
    echo -e "\n${RED}Invalid choice. Cancelling commit.${NC}"
    exit 1
    ;;
esac

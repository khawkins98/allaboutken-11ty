# Git Hooks

This directory contains shared git hooks for the repository. They are configured to run automatically when you use git commands.

Canonical documentation for hook behavior and troubleshooting lives in [`docs/GIT_HOOKS.md`](../docs/GIT_HOOKS.md).

## Setup

Hooks are automatically enabled via `core.hooksPath`. If you haven't already, run:

```bash
git config core.hooksPath .githooks
```

## Available Hooks

### pre-push

Reminds you about PR title format requirements before pushing. This helps catch issues early that would otherwise fail in the `pr-title-check` GitHub Actions workflow.

**Required CI format:**
```
<prefix>(optional-scope): <description>
```

**Valid prefixes:** `content`, `feature`, `fix`, `ci`, `chore`
**Optional scope:** lowercase letters/numbers separated by `.`, `_`, or `-`

Commit subjects and PR titles are both checked by `scripts/validate-commit-subject.sh`, including the 72-character limit and no-trailing-period rule. Run `yarn test:commit-subject` to test the validator.

**Examples:**
- ✓ `content: New blog post on editorial AI`
- ✓ `feature: Add semantic search to posts`
- ✓ `fix: Correct image paths in 2025 posts`
- ✓ `chore(deps): Upgrade pagefind and regenerate vectors`
- ✗ `Editorial AI Framework: Three interconnected posts` ← fails check
- ✗ `Add verify-contracts script and wire into CI` ← fails check

If you create a PR with an invalid title on GitHub, the workflow will fail and you'll need to edit the PR title to fix it.

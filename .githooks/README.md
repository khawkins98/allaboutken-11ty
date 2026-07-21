# Git Hooks

This directory contains shared git hooks for the repository. They are configured to run automatically when you use git commands.

Canonical documentation for hook behavior and troubleshooting lives in [`docs/GIT_HOOKS.md`](../docs/GIT_HOOKS.md).

## Setup

Hooks are automatically enabled via `core.hooksPath`. If you haven't already, run:

```bash
git config core.hooksPath .githooks
```

## Available Hooks

### prepare-commit-msg

Normalizes common commit subject issues before validation:

- Uppercase prefix -> lowercase
- Spacing around `:` normalized to `<prefix>: <description>`
- Leading/trailing whitespace trimmed
- Trailing period removed

It skips machine-generated subjects (`Merge`, `Revert`, `fixup!`, `squash!`).

If a message still does not match the required format after normalization, `commit-msg` blocks the commit.

### pre-push

Reminds you about PR title format requirements before pushing. This helps catch issues early that would otherwise fail in the `pr-title-check` GitHub Actions workflow.

**Required CI format:**
```
<prefix>: <description>
```

**Valid prefixes:** `content`, `feature`, `fix`, `ci`, `chore`
**Optional scope:** `chore(deps): <description>` is allowed

**Examples:**
- ✓ `content: New blog post on editorial AI`
- ✓ `feature: Add semantic search to posts`
- ✓ `fix: Correct image paths in 2025 posts`
- ✓ `chore(deps): Upgrade pagefind and regenerate vectors.`
- ✗ `Editorial AI Framework: Three interconnected posts` ← fails check
- ✗ `Add verify-contracts script and wire into CI` ← fails check

If you create a PR with an invalid title on GitHub, the workflow will fail and you'll need to edit the PR title to fix it.

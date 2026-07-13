# Git Hooks

This directory contains shared git hooks for the repository. They are configured to run automatically when you use git commands.

Canonical documentation for hook behavior and troubleshooting lives in [`docs/GIT_HOOKS.md`](../docs/GIT_HOOKS.md).

## Setup

Hooks are automatically enabled via `core.hooksPath`. If you haven't already, run:

```bash
git config core.hooksPath .githooks
```

## Available Hooks

### commit-msg

Validates that the commit subject matches the convention before the commit is recorded. This is the enforcement layer for individual commits.

**Required format:**
```
<prefix>(<scope>): <description>
```

**Valid prefixes:** `content`, `feature`, `fix`, `ci`, `chore`
**Optional scope:** a short identifier in parentheses, e.g. `(deps)`, `(auth)`, `(search)`

**Examples:**
- ✓ `chore: bump eslint to v9`
- ✓ `chore(deps): upgrade pagefind and regenerate vectors`
- ✓ `fix(search): correct empty-query handling`
- ✓ `content: new post on semantic search`
- ✗ `update deps` ← missing prefix
- ✗ `chore: bump eslint.` ← trailing period

**Rules:** subject ≤ 72 characters, no trailing period.
Merge, revert, fixup, and squash commits are automatically skipped.

### pre-push

Reminds you about PR title format requirements before pushing. This helps catch issues early that would otherwise fail in the `pr-title-check` GitHub Actions workflow.

**Required CI format:**
```
<prefix>(<scope>): <description>
```

**Valid prefixes:** `content`, `feature`, `fix`, `ci`, `chore`
**Optional scope:** `chore(deps): <description>` is allowed

**Examples:**
- ✓ `content(posts): New blog post on editorial AI`
- ✓ `feature(search): Add semantic search to posts`
- ✓ `fix: Correct image paths in 2025 posts`
- ✓ `chore(deps): Upgrade pagefind and regenerate vectors`
- ✗ `Editorial AI Framework: Three interconnected posts` ← fails check
- ✗ `Add verify-contracts script and wire into CI` ← fails check

If you create a PR with an invalid title on GitHub, the workflow will fail and you'll need to edit the PR title to fix it.

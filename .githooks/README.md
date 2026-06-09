# Git Hooks

This directory contains shared git hooks for the repository. They are configured to run automatically when you use git commands.

## Setup

Hooks are automatically enabled via `core.hooksPath`. If you haven't already, run:

```bash
git config core.hooksPath .githooks
```

## Available Hooks

### pre-push

Reminds you about PR title format requirements before pushing. This helps catch issues early that would otherwise fail in the `pr-title-check` GitHub Actions workflow.

**Required format:**
```
<prefix>: <description>
```

**Valid prefixes:** `content`, `feature`, `fix`, `ci`, `chore`

**Examples:**
- ✓ `content: New blog post on editorial AI`
- ✓ `feature: Add semantic search to posts`
- ✓ `fix: Correct image paths in 2025 posts`
- ✗ `Editorial AI Framework: Three interconnected posts` ← fails check
- ✗ `Add verify-contracts script and wire into CI` ← fails check

If you create a PR with an invalid title on GitHub, the workflow will fail and you'll need to edit the PR title to fix it.

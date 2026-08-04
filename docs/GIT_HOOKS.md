# Git hooks

Canonical reference for local Git hook behavior in this repository.

## How hooks are enabled

- This repo stores hooks in [`.githooks/`](../.githooks/).
- `yarn install` runs `yarn prepare`, which sets:
  - `git config core.hooksPath .githooks`
- If hooks are not active, run this manually from the repo root:

```bash
git config core.hooksPath .githooks
```

## Active hooks

### `.githooks/prepare-commit-msg` (normalizes)

Normalizes the first commit subject line before validation:

- Detects the first non-empty, non-comment line.
- Trims leading/trailing whitespace.
- Skips machine-generated subjects: `Merge`, `Revert`, `fixup!`, `squash!`.
- For known prefixes, it applies deterministic normalization:
  - `content`, `feature`, `fix`, `ci`, `chore`
  - lowercases the prefix
  - normalizes colon spacing to exactly one space
  - trims description leading/trailing whitespace
  - removes one trailing period
- Unknown prefixes are not rewritten.

### `.githooks/commit-msg` (enforced)

Validates the final commit subject against:

- Pattern: `<prefix>[(<scope>)]: <description>` (scope is optional)
- Allowed prefixes: `content`, `feature`, `fix`, `ci`, `chore`
- Required non-empty description
- Subject length: `<= 72` characters
- No trailing period
- Merge/revert/fixup/squash subjects are skipped

**Examples:**
- ✓ `chore: update dependencies`
- ✓ `chore(deps): upgrade pagefind to v1.3`
- ✓ `fix(auth): correct token expiry check`
- ✓ `feature(search): add semantic search results page`
- ✗ `update deps` ← missing prefix
- ✗ `chore: update deps.` ← trailing period
- ✗ `release: create v2.0 release` ← unknown prefix

### `.githooks/test-commit-msg-hooks.sh` (tests)

Run the commit-message normalization and enforcement regression checks with:

```bash
bash .githooks/test-commit-msg-hooks.sh
```

### `.githooks/pre-push` (advisory)


Prints pull request title format guidance before push. It does not block the push; CI is the enforcement source of truth.

## PR title enforcement in CI

GitHub Actions enforces PR titles in [`.github/workflows/pr-title-check.yml`](../.github/workflows/pr-title-check.yml):

- Pattern: `<prefix>: <description>` (optional scope allowed, for example `chore(deps): ...`)
- Allowed prefixes: `content`, `feature`, `fix`, `ci`, `chore`
- Scope is optional and follows the same `(<scope>)` syntax as commit subjects
- PR titles are not limited to 72 characters and may end with punctuation

The workflow does **not** enforce maximum title length or trailing punctuation.

## Troubleshooting

### Hooks are not running

1. Confirm hooks path:

   ```bash
   git config --get core.hooksPath
   ```

   Expected output: `.githooks`

2. Re-run setup:

   ```bash
   yarn prepare
   ```

3. Ensure hook files are executable:

   ```bash
   ls -l .githooks
   ```

   You should see executable permissions on hook files (`prepare-commit-msg`, `commit-msg`, `pre-push`).

### CI fails PR title check but local commits succeed

The commit hook validates commit subjects; CI validates the **PR title** separately. Update the PR title in GitHub to match the same `<prefix>: <description>` convention.

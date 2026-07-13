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

### `.githooks/commit-msg` (enforced)

Checks the commit subject against:

- Pattern: `<prefix>(optional-scope): <description>`
- Allowed prefixes: `content`, `feature`, `fix`, `ci`, `chore`
- Subject length: `<= 72` characters
- No trailing period
- Merge/revert/fixup/squash subjects are skipped

### `.githooks/pre-push` (advisory)

Prints pull request title format guidance before push. It does not block the push; CI is the enforcement source of truth.

## PR title enforcement in CI

GitHub Actions enforces PR titles in [`.github/workflows/pr-title-check.yml`](../.github/workflows/pr-title-check.yml):

- Pattern: `<prefix>(optional-scope): <description>` (for example `chore(deps): ...`)
- Allowed prefixes: `content`, `feature`, `fix`, `ci`, `chore`

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

   You should see executable permissions on hook files (`commit-msg`, `pre-push`).

### CI fails PR title check but local commits succeed

The commit hook validates commit subjects; CI validates the **PR title** separately. Update the PR title in GitHub to match the same `<prefix>(optional-scope): <description>` convention.

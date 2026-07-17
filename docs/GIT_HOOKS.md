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
- Optional scope: lowercase letters/numbers separated by `.`, `_`, or `-`
- Subject length: `<= 72` characters
- No trailing period
- Merge/revert/fixup/squash subjects are skipped

The hook extracts the first non-comment, non-empty line and passes it to [`scripts/validate-commit-subject.sh`](../scripts/validate-commit-subject.sh). Run `yarn test:commit-subject` to exercise the shared validator regression suite.

### `.githooks/pre-push` (advisory)

Prints pull request title format guidance before push. It does not block the push; CI is the enforcement source of truth.

## PR title enforcement in CI

GitHub Actions enforces PR titles in [`.github/workflows/pr-title-check.yml`](../.github/workflows/pr-title-check.yml):

- Pattern: `<prefix>(optional-scope): <description>` (for example, `chore(deps): Upgrade pagefind`)
- Allowed prefixes: `content`, `feature`, `fix`, `ci`, `chore`
- The same scope, spacing, 72-character, and punctuation rules as local commits

The workflow checks out the repository, runs the validator tests, and passes the PR title to the same shared validator used by the commit hook.

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

### A subject or PR title is rejected

Read the validator's error output, then compare the subject with `<prefix>(optional-scope): <description>`. Check the prefix, lowercase scope characters, exact `: ` spacing, 72-character limit, and trailing punctuation. Run the subject directly for the same diagnostics CI uses:

```bash
scripts/validate-commit-subject.sh "chore(deps): Upgrade pagefind"
```

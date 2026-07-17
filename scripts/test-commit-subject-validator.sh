#!/usr/bin/env bash
# Dependency-free regression tests for validate-commit-subject.sh.
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
validator="${script_dir}/validate-commit-subject.sh"
passed=0

expect_valid() {
  local subject="$1"

  if ! "$validator" "$subject" >/dev/null 2>&1; then
    echo "FAIL: expected valid subject: ${subject}" >&2
    exit 1
  fi
  passed=$((passed + 1))
}

expect_invalid() {
  local subject="$1"

  if "$validator" "$subject" >/dev/null 2>&1; then
    echo "FAIL: expected invalid subject: ${subject}" >&2
    exit 1
  fi
  passed=$((passed + 1))
}

expect_generated_commit() {
  local subject="$1"

  if ! "$validator" --allow-generated "$subject" >/dev/null 2>&1; then
    echo "FAIL: expected valid generated commit subject: ${subject}" >&2
    exit 1
  fi
  if "$validator" "$subject" >/dev/null 2>&1; then
    echo "FAIL: expected generated-looking PR title to be invalid: ${subject}" >&2
    exit 1
  fi
  passed=$((passed + 2))
}

# Standard subjects and optional scopes.
expect_valid "content: Add editorial workflow overview"
expect_valid "feature(search-ui): Add result filters"
expect_valid "chore(deps): Upgrade pagefind"

# Unknown prefixes, spacing, empty descriptions, length, and punctuation.
expect_invalid "docs: Explain the workflow"
expect_invalid "fix:Missing required space"
expect_invalid "fix : Add required spacing"
expect_invalid "fix: "
expect_invalid "fix: Add trailing whitespace "
expect_invalid "feature(Search): Reject uppercase scope"
expect_invalid "chore: $(printf 'x%.0s' {1..66})"
expect_invalid "ci: Update title validation."

# Git-generated commit subjects are exempt, but matching PR titles are not.
expect_generated_commit "Merge branch 'main' into feature/example."
expect_generated_commit "Revert \"fix: Introduce regression.\""
expect_generated_commit "fixup! chore: $(printf 'x%.0s' {1..80})."
expect_generated_commit "squash! feature: Temporary subject."

echo "Commit subject validator: ${passed} tests passed"

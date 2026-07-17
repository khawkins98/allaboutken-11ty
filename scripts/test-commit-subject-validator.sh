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

# Git-generated subjects are exempt from authored-subject rules.
expect_valid "Merge branch 'main' into feature/example."
expect_valid "Revert \"fix: Introduce regression.\""
expect_valid "fixup! chore: $(printf 'x%.0s' {1..80})."
expect_valid "squash! feature: Temporary subject."

echo "Commit subject validator: ${passed} tests passed"

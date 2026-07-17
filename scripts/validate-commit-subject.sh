#!/usr/bin/env bash
# Validate a commit subject or PR title against the repository convention.
set -euo pipefail

allowed_prefixes="content | feature | fix | ci | chore"
expected_format='<prefix>(optional-scope): <description>'

fail() {
  local reason="$1"

  echo "Subject format error: ${reason}" >&2
  echo "Expected: ${expected_format}" >&2
  echo "Prefixes: ${allowed_prefixes}" >&2
  echo "Scope: lowercase letters/numbers, optionally with ., _, or -" >&2
  echo "Rules: subject <= 72 chars, exact ': ' spacing, no trailing period" >&2
  echo "Got: ${subject}" >&2
  exit 1
}

allow_generated=false
if [[ "${1:-}" == "--allow-generated" ]]; then
  allow_generated=true
  shift
fi

if (( $# != 1 )); then
  echo "Usage: $0 [--allow-generated] \"<subject>\"" >&2
  exit 2
fi

subject="$1"

# Only the commit hook enables this mode. PR titles are always authored text and
# must use the canonical format, even when they resemble Git-generated subjects.
if [[ "$allow_generated" == true ]]; then
  case "$subject" in
    "Merge "*|"Revert "*|"fixup! "*|"squash! "*) exit 0 ;;
  esac
fi

if [[ -z "$subject" ]]; then
  fail "subject cannot be empty"
fi

if (( ${#subject} > 72 )); then
  fail "subject is ${#subject} characters (maximum 72)"
fi

case "$subject" in
  *.) fail "subject must not end with a period" ;;
esac

subject_pattern='^(content|feature|fix|ci|chore)(\([a-z0-9]+([._-][a-z0-9]+)*\))?: [^[:space:]](.*[^[:space:]])?$'
if ! [[ "$subject" =~ $subject_pattern ]]; then
  fail "use an allowed prefix, a valid optional scope, and exact ': ' spacing"
fi

exit 0

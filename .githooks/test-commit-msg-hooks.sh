#!/usr/bin/env bash
set -euo pipefail

hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
msg_file="$(mktemp)"

cleanup() {
  rm -f "$msg_file"
}
trap cleanup EXIT

fail() {
  echo "Hook test failed: $1" >&2
  exit 1
}

assert_subject() {
  local expected="$1"
  local actual
  IFS= read -r actual < "$msg_file"
  [[ "$actual" == "$expected" ]] || fail "expected '$expected', got '$actual'"
}

printf '%s\n\n%s\n' ' Fix : preserve \n and \t tokens. ' 'Body remains.' > "$msg_file"
"$hook_dir/prepare-commit-msg" "$msg_file"
assert_subject 'fix: preserve \n and \t tokens'
[[ "$(sed -n '3p' "$msg_file")" == 'Body remains.' ]] || fail 'commit body changed'
"$hook_dir/commit-msg" "$msg_file"

printf '%s\n' 'unknown: description' > "$msg_file"
if "$hook_dir/commit-msg" "$msg_file" >/dev/null 2>&1; then
  fail 'unknown prefix was accepted'
fi

printf '%s\n' 'chore:    ' > "$msg_file"
"$hook_dir/prepare-commit-msg" "$msg_file"
if "$hook_dir/commit-msg" "$msg_file" >/dev/null 2>&1; then
  fail 'empty description was accepted'
fi

echo 'Commit message hook tests passed.'

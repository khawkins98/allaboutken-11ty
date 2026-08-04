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
  actual="$(sed -n '1p' "$msg_file")"
  [[ "$actual" == "$expected" ]] || fail "expected subject '$expected', got '$actual'"
}

assert_commit_accepts() {
  if ! "$hook_dir/commit-msg" "$msg_file" >/dev/null 2>&1; then
    fail "$1"
  fi
}

assert_commit_rejects() {
  if "$hook_dir/commit-msg" "$msg_file" >/dev/null 2>&1; then
    fail "$1"
  fi
}

# Uppercase prefix normalization + spacing + trailing period cleanup.
cat <<'MSG' > "$msg_file"
  FiX   :  Normalize subject shape.
MSG
"$hook_dir/prepare-commit-msg" "$msg_file"
assert_subject 'fix: Normalize subject shape'
assert_commit_accepts 'uppercase prefix + spacing + trailing period'

# Trailing period removal.
cat <<'MSG' > "$msg_file"
chore: remove trailing period.
MSG
"$hook_dir/prepare-commit-msg" "$msg_file"
assert_subject 'chore: remove trailing period'
assert_commit_accepts 'trailing-period normalization'

# Leading/trailing whitespace cleanup and body preservation.
cat <<'MSG' > "$msg_file"
   content   :   whitespace cleanup.  

Body line must stay.
MSG
"$hook_dir/prepare-commit-msg" "$msg_file"
assert_subject 'content: whitespace cleanup'
[[ "$(sed -n '3p' "$msg_file")" == 'Body line must stay.' ]] || fail 'commit body changed'
assert_commit_accepts 'leading/trailing subject whitespace + body preservation'

# Spacing normalization around colon.
cat <<'MSG' > "$msg_file"
fix    :    standardize colon spacing.
MSG
"$hook_dir/prepare-commit-msg" "$msg_file"
assert_subject 'fix: standardize colon spacing'
assert_commit_accepts 'colon spacing normalization'

# Unknown prefix is not rewritten by normalization.
cat <<'MSG' > "$msg_file"
  unknown  :   should stay untouched.
MSG
"$hook_dir/prepare-commit-msg" "$msg_file"
assert_subject 'unknown  :   should stay untouched.'
assert_commit_rejects 'unknown prefix should be rejected'

# Empty description is rejected.
cat <<'MSG' > "$msg_file"
feature:
 
MSG
"$hook_dir/prepare-commit-msg" "$msg_file"
assert_commit_rejects 'empty description should be rejected'

echo 'Commit message hook tests passed.'

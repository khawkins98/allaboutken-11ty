#!/usr/bin/env bash

# Shared commit message format constants used by local git hooks.
ALLOWED_PREFIXES=("content" "feature" "fix" "ci" "chore")
SKIP_PREFIXES=("Merge " "Revert " "fixup! " "squash! ")
MAX_SUBJECT_LENGTH=72

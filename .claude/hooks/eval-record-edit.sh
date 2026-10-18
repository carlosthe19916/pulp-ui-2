#!/usr/bin/env bash
# PostToolUse hook: record, per session, which client/src/ files Claude edits.
#
# The Stop gate (eval-gate.sh) uses this record to scope verification to edits
# THIS session actually made — so a pure question turn, or a turn on a tree that
# already carried unrelated uncommitted changes, never blocks.
#
# Never blocks: this hook only appends to .claude/.eval-state/<session_id>.edits
# and always exits 0.
set -euo pipefail

input=$(cat 2>/dev/null || echo '{}')

session_id=$(printf '%s' "$input" | jq -r '.session_id // ""' 2>/dev/null || echo "")
[ -z "$session_id" ] && exit 0

cwd=$(printf '%s' "$input" | jq -r '.cwd // "."' 2>/dev/null || echo ".")
cd "$cwd" 2>/dev/null || exit 0

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // ""' 2>/dev/null || echo "")
[ -z "$file_path" ] && exit 0

# Resolve to a path relative to the repo root so it matches `git status` output.
root=$(git rev-parse --show-toplevel 2>/dev/null || echo "$cwd")
case "$file_path" in
  /*) rel=${file_path#"$root"/} ;;   # absolute -> strip the repo root prefix
  *)  rel=$file_path ;;              # already relative (to cwd == root here)
esac

# Only track edits under client/src/ — the gate's watched root.
case "$rel" in
  client/src/*) ;;
  *) exit 0 ;;
esac

mkdir -p .claude/.eval-state 2>/dev/null || exit 0
printf '%s\n' "$rel" >>".claude/.eval-state/${session_id}.edits" 2>/dev/null || true
exit 0

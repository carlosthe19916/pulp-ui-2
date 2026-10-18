#!/usr/bin/env bash
# Stop hook: before a turn may end, require that /eval has run against the
# client/src changes THIS session made. The /eval command touches
# .claude/.eval-ran when it finishes; this gate blocks the stop while that marker
# is older than the newest session-edited change under client/src/.
#
# Session scoping: the PostToolUse hook eval-record-edit.sh records which
# client/src files Claude edited this session in .claude/.eval-state/<id>.edits.
# The gate only considers those files — so a question turn (no edits) and
# pre-existing, Claude-untouched tree changes never block.
#
# Self-correcting: running /eval refreshes the marker and unblocks.
# Safety escape: if we are already continuing because of this hook
# (stop_hook_active) we allow the stop, so a refused eval can never hard-lock.
set -euo pipefail

input=$(cat 2>/dev/null || echo '{}')

stop_hook_active=$(printf '%s' "$input" | jq -r '.stop_hook_active // false' 2>/dev/null || echo false)
[ "$stop_hook_active" = "true" ] && exit 0

cwd=$(printf '%s' "$input" | jq -r '.cwd // "."' 2>/dev/null || echo ".")
cd "$cwd" 2>/dev/null || exit 0

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

# Only files Claude edited this session count. No record -> nothing to verify.
session_id=$(printf '%s' "$input" | jq -r '.session_id // ""' 2>/dev/null || echo "")
edits_file=".claude/.eval-state/${session_id}.edits"
if [ -z "$session_id" ] || [ ! -s "$edits_file" ]; then
  # Opportunistically prune stale per-session records (best effort).
  find .claude/.eval-state -name '*.edits' -mtime +7 -delete 2>/dev/null || true
  exit 0
fi

marker=".claude/.eval-ran"

# Which convention specs apply to the current changes? Routing is self-describing
# (each evals/*.md declares its own globs); eval-select.sh is the single source of
# truth, shared with the /eval command.
specs=$("$CLAUDE_PROJECT_DIR/.claude/hooks/eval-select.sh" "$cwd" 2>/dev/null || true)

# No spec covers these changes -> nothing to verify.
[ -z "$specs" ] && exit 0

# Uncommitted changes (modified, staged, untracked) under client/src/, limited to
# files Claude edited this session (present in edits_file).
# porcelain line is "XY <path>"; strip the 3-char status prefix.
newest=0
while IFS= read -r line; do
  [ -z "$line" ] && continue
  f=${line:3}
  f=${f##*-> }          # for renames, take the new path
  [ -f "$f" ] || continue
  grep -qxF "$f" "$edits_file" || continue   # only this session's edits
  m=$(stat -c %Y "$f" 2>/dev/null || echo 0)
  [ "$m" -gt "$newest" ] && newest=$m
done < <(git status --porcelain=v1 -- client/src 2>/dev/null)

# No session-edited watched changes -> nothing to verify.
[ "$newest" -eq 0 ] && exit 0

marker_mtime=0
[ -f "$marker" ] && marker_mtime=$(stat -c %Y "$marker" 2>/dev/null || echo 0)

# /eval ran after the latest change -> allow.
[ "$marker_mtime" -ge "$newest" ] && exit 0

# Name the specs that actually matched, so the message is actionable.
spec_list=""
while IFS= read -r s; do
  [ -z "$s" ] && continue
  spec_list="${spec_list:+$spec_list, }$s"
done <<<"$specs"

reason="Changes under client/src/ have not been verified against the convention specs in evals/ since the last edit. Matching specs: ${spec_list}. Run the /eval command now: check the changed files against each matching spec's checklist, fix any VIOLATION it reports, and finish by running \`touch .claude/.eval-ran\` (as /eval instructs). Only then end the turn."

jq -nc --arg reason "$reason" '{decision:"block", reason:$reason}'
exit 0

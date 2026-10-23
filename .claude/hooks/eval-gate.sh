#!/usr/bin/env bash
# eval-gate: Stop hook.
#
# Blocks the turn from ending while this session has client/src/ edits that
# match an evals/*.md spec (see eval-select.sh) and /eval hasn't run since the
# last edit. /eval marks completion by touching .claude/.eval-ran.
#
# Sessions that edited nothing under client/src/ (no .claude/.eval-state/<id>
# record from eval-track.sh) are never blocked.
set -uo pipefail

input=$(cat)
session=$(sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' <<<"$input" | head -n1)
[ -z "$session" ] && exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
state=".claude/.eval-state/$session"
marker=".claude/.eval-ran"

[ -f "$state" ] || exit 0
[ -f "$marker" ] && [ "$marker" -nt "$state" ] && exit 0

specs=$(.claude/hooks/eval-select.sh . 2>/dev/null)
[ -z "$specs" ] && exit 0

{
  echo "client/src/ changed since the last /eval. Run /eval before finishing."
  echo "Specs in scope:"
  sed 's/^/  - /' <<<"$specs"
} >&2
exit 2

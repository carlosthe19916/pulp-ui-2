#!/usr/bin/env bash
# eval-track: PostToolUse hook (Edit|Write|MultiEdit|NotebookEdit).
#
# Records that this session edited a file under client/src/ by touching
# .claude/.eval-state/<session_id>. The Stop hook eval-gate.sh only gates
# sessions that have such a record, and compares it with the /eval marker.
set -uo pipefail

input=$(cat)
field() { sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" <<<"$input" | head -n1; }

session=$(field session_id)
path=$(field file_path)
[ -z "$path" ] && path=$(field notebook_path)
[ -z "$session" ] || [ -z "$path" ] && exit 0

case "$path" in
  */client/src/* | client/src/*) ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
mkdir -p .claude/.eval-state && touch ".claude/.eval-state/$session"
exit 0

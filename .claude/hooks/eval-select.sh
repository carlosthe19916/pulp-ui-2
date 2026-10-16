#!/usr/bin/env bash
# eval-select: the single source of truth for file -> eval routing.
#
# For each evals/*.md, read its `globs:` frontmatter line (comma-separated
# patterns) and test whether any working-tree change matches, using git
# pathspec glob magic (`:(glob)...`). Print the path of every matching spec,
# one per line; empty output means no spec applies to the current changes.
#
# Shared by the /eval command (to pick which specs to verify) and the Stop hook
# eval-gate.sh (to decide whether verification is even required). Dropping in a
# new evals/*.md with frontmatter is enough — no edits here.
#
# Usage: eval-select.sh [cwd]
set -euo pipefail

cd "${1:-.}" 2>/dev/null || exit 0

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

shopt -s nullglob
for spec in evals/*.md; do
  # Extract the single `globs:` frontmatter line (first match wins).
  globs=$(grep -m1 '^globs:' "$spec" 2>/dev/null || true)
  [ -z "$globs" ] && continue
  globs=${globs#globs:}

  # Split on commas into git pathspecs, one `:(glob)` per pattern (OR-matched).
  pathspecs=()
  IFS=',' read -ra patterns <<<"$globs"
  for p in "${patterns[@]}"; do
    # Trim surrounding whitespace via parameter expansion.
    p=${p#"${p%%[![:space:]]*}"}
    p=${p%"${p##*[![:space:]]}"}
    [ -z "$p" ] && continue
    pathspecs+=(":(glob)$p")
  done
  [ ${#pathspecs[@]} -eq 0 ] && continue

  if [ -n "$(git status --porcelain=v1 -- "${pathspecs[@]}" 2>/dev/null)" ]; then
    echo "$spec"
  fi
done

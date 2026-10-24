#!/usr/bin/env bash
# Shared helpers for agent-harness evals.
set -euo pipefail

evals_root() {
  local here
  here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  printf '%s\n' "$here"
}

repo_root() {
  local root
  root="$(cd "$(evals_root)/.." && pwd)"
  printf '%s\n' "$root"
}

build_root() {
  printf '%s\n' "$(repo_root)/.build/agent-evals"
}

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

# Extract the first JSON object/array from model text into $2.
extract_json() {
  local raw="$1"
  local dest="$2"
  python3 - "$raw" "$dest" <<'PY'
import json, re, sys
raw_path, dest = sys.argv[1], sys.argv[2]
text = open(raw_path, encoding="utf-8").read().strip()
# Strip common markdown fences
fence = re.match(r"^```(?:json)?\s*\n(.*)\n```\s*$", text, re.DOTALL | re.IGNORECASE)
if fence:
    text = fence.group(1).strip()
# Prefer first object / array span
for opener, closer in (("{", "}"), ("[", "]")):
    start = text.find(opener)
    if start < 0:
        continue
    depth = 0
    in_str = False
    esc = False
    for i, ch in enumerate(text[start:], start):
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == opener:
            depth += 1
        elif ch == closer:
            depth -= 1
            if depth == 0:
                candidate = text[start : i + 1]
                try:
                    json.loads(candidate)
                except json.JSONDecodeError:
                    break
                open(dest, "w", encoding="utf-8").write(candidate + "\n")
                sys.exit(0)
print("could not extract JSON from model output", file=sys.stderr)
sys.exit(1)
PY
}

list_cases() {
  local cases_dir
  cases_dir="$(evals_root)/cases"
  local d
  for d in "$cases_dir"/*/; do
    [ -d "$d" ] || continue
    basename "$d"
  done | sort
}

case_dir() {
  printf '%s\n' "$(evals_root)/cases/$1"
}

validate_case() {
  local id="$1"
  local dir
  dir="$(case_dir "$id")"
  [ -d "$dir" ] || die "unknown case: $id"
  [ -f "$dir/meta.json" ] || die "$id: missing meta.json"
  [ -f "$dir/prompt.md" ] || die "$id: missing prompt.md"
  [ -x "$dir/check.sh" ] || [ -f "$dir/check.sh" ] || die "$id: missing check.sh"
  python3 - "$dir/meta.json" <<'PY'
import json, sys
meta = json.load(open(sys.argv[1], encoding="utf-8"))
for key in ("id", "description", "targets"):
    if key not in meta:
        raise SystemExit(f"meta.json missing '{key}'")
PY
  chmod +x "$dir/check.sh" 2>/dev/null || true
}

# Prepare a worktree arm. Prints the absolute path of the arm directory.
prepare_arm() {
  local arm="$1"
  local run_dir="$2"
  local arm_dir="$run_dir/arms/$arm"
  mkdir -p "$arm_dir"

  case "$arm" in
  current)
    # Live checkout so uncommitted rule edits are under test.
    printf '%s\n' "$(repo_root)"
    # Ensure Claude Code discovers AGENTS.md
    if [ ! -e "$(repo_root)/CLAUDE.md" ]; then
      ln -sfn AGENTS.md "$(repo_root)/CLAUDE.md"
    fi
    ;;
  baseline)
    need_cmd git
    local wt="$arm_dir/worktree"
    rm -rf "$wt"
    # Detached worktree from HEAD; then strip guidance so the base model
    # answers without this repo's rules / AGENTS.md / skills.
    git -C "$(repo_root)" worktree remove --force "$wt" 2>/dev/null || true
    git -C "$(repo_root)" worktree add --detach "$wt" HEAD >/dev/null
    rm -f "$wt/AGENTS.md" "$wt/CLAUDE.md"
    rm -rf "$wt/.rulesync/rules" "$wt/.claude/rules" "$wt/.cursor/rules"
    rm -rf "$wt/.claude/skills" "$wt/.agents/skills"
    mkdir -p "$wt/.rulesync/rules" "$wt/.claude/rules" "$wt/.cursor/rules"
    # Neutral stub so tools that require a project doc still start.
    printf '%s\n' '# No project-specific agent guidance in this eval arm.' >"$wt/AGENTS.md"
    ln -sfn AGENTS.md "$wt/CLAUDE.md"
    printf '%s\n' "$wt"
    ;;
  *)
    die "unknown arm: $arm (expected current|baseline)"
    ;;
  esac
}

cleanup_arm() {
  local arm="$1"
  local run_dir="$2"
  if [ "$arm" = baseline ]; then
    local wt="$run_dir/arms/baseline/worktree"
    if [ -d "$wt" ]; then
      git -C "$(repo_root)" worktree remove --force "$wt" 2>/dev/null || rm -rf "$wt"
    fi
  fi
}

run_agent() {
  local work_dir="$1"
  local prompt_file="$2"
  local raw_out="$3"
  local arm="${4:-current}"
  need_cmd claude
  # Prompt via stdin so markdown (**…**) is never mistaken for CLI flags.
  # Only `Read` — Glob/Grep would let baseline recover conventions from source
  # and defeat the with/without-guidance comparison.
  # --dangerously-skip-permissions keeps -p non-interactive in sandboxes.
  # baseline uses --bare so CLAUDE.md / rules / skills are not auto-loaded from
  # the environment; current keeps normal discovery of CLAUDE.md → AGENTS.md.
  local -a args=(
    -p
    --dangerously-skip-permissions
    --allowedTools Read
  )
  if [ "$arm" = baseline ]; then
    args+=(--bare)
  fi
  (
    cd "$work_dir"
    claude "${args[@]}" <"$prompt_file"
  ) >"$raw_out" 2>"${raw_out}.stderr"
}

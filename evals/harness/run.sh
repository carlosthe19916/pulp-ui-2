#!/usr/bin/env bash
# Run agent-harness evals (AGENTS.md / rules / skills), not code-vs-rules /eval.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

ARMS="current"
CASE_FILTER=""
VALIDATE_ONLY=0
REPEAT="${EVAL_REPEAT:-1}"

usage() {
  cat <<'EOF'
Usage: evals/harness/run.sh [options]

  --arms current|baseline|current,baseline   (default: current)
  --case <id>                                run one case
  --validate                                 check case layout only
  --repeat <n>                               override EVAL_REPEAT (default 1)
  -h, --help

Env:
  EVAL_REPEAT   times to run each case/arm (default 1)
  MODEL         unused placeholder for future model pin
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
  --arms)
    ARMS="${2:?}"
    shift 2
    ;;
  --case)
    CASE_FILTER="${2:?}"
    shift 2
    ;;
  --validate)
    VALIDATE_ONLY=1
    shift
    ;;
  --repeat)
    REPEAT="${2:?}"
    shift 2
    ;;
  -h | --help)
    usage
    exit 0
    ;;
  *)
    die "unknown arg: $1"
    ;;
  esac
done

IFS=',' read -r -a ARM_LIST <<<"$ARMS"
CASES=()
if [ -n "$CASE_FILTER" ]; then
  CASES=("$CASE_FILTER")
else
  while IFS= read -r c; do
    CASES+=("$c")
  done < <(list_cases)
fi

[ ${#CASES[@]} -gt 0 ] || die "no cases found under evals/cases/"

for c in "${CASES[@]}"; do
  validate_case "$c"
done

if [ "$VALIDATE_ONLY" -eq 1 ]; then
  printf 'OK — %d case(s) valid\n' "${#CASES[@]}"
  exit 0
fi

need_cmd claude
need_cmd python3
need_cmd git

RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_DIR="$(build_root)/runs/$RUN_ID"
mkdir -p "$RUN_DIR"
SUMMARY="$RUN_DIR/summary.json"
: >"$RUN_DIR/results.ndjson"

printf 'run dir: %s\n' "$RUN_DIR"
printf 'arms: %s\n' "$ARMS"
printf 'cases: %s\n' "${CASES[*]}"

declare -A ARM_PATHS=()
for arm in "${ARM_LIST[@]}"; do
  ARM_PATHS[$arm]="$(prepare_arm "$arm" "$RUN_DIR")"
  printf 'arm %-9s → %s\n' "$arm" "${ARM_PATHS[$arm]}"
done

cleanup() {
  for arm in "${ARM_LIST[@]}"; do
    cleanup_arm "$arm" "$RUN_DIR" || true
  done
}
trap cleanup EXIT

CURRENT_PASS=0
CURRENT_FAIL=0
BASELINE_PASS=0
BASELINE_FAIL=0
CANARY_FAILED=0

for case_id in "${CASES[@]}"; do
  meta="$(case_dir "$case_id")/meta.json"
  must_pass="$(python3 -c 'import json,sys; print("1" if json.load(open(sys.argv[1])).get("must_pass") else "0")' "$meta")"
  desc="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["description"])' "$meta")"

  for arm in "${ARM_LIST[@]}"; do
    for ((i = 1; i <= REPEAT; i++)); do
      out_dir="$RUN_DIR/$case_id/$arm/r$i"
      mkdir -p "$out_dir"
      raw="$out_dir/raw.txt"
      answer="$out_dir/answer.json"
      grade_log="$out_dir/grade.log"

      printf '\n▸ %s [%s] repeat %d/%d — %s\n' "$case_id" "$arm" "$i" "$REPEAT" "$desc"

      if ! run_agent "${ARM_PATHS[$arm]}" "$(case_dir "$case_id")/prompt.md" "$raw" "$arm"; then
        printf 'FAIL — agent invocation error (see %s.stderr)\n' "$raw" >&2
        status="agent_error"
        ok=0
      elif ! extract_json "$raw" "$answer"; then
        printf 'FAIL — could not parse JSON from agent output\n' >&2
        status="bad_json"
        ok=0
        cp "$raw" "$out_dir/raw.unparsed.txt" 2>/dev/null || true
      elif "$(case_dir "$case_id")/check.sh" "$answer" >"$grade_log" 2>&1; then
        status="pass"
        ok=1
        printf 'PASS\n'
      else
        status="fail"
        ok=0
        printf 'FAIL — grader:\n' >&2
        sed 's/^/  /' "$grade_log" >&2 || true
      fi

      python3 - "$RUN_DIR/results.ndjson" "$case_id" "$arm" "$i" "$status" "$ok" "$must_pass" <<'PY'
import json, sys, pathlib
ndjson_path, case_id, arm, rep, status, ok, must_pass = sys.argv[1:8]
row = {
    "case": case_id,
    "arm": arm,
    "repeat": int(rep),
    "status": status,
    "ok": ok == "1",
    "must_pass": must_pass == "1",
}
pathlib.Path(ndjson_path).open("a", encoding="utf-8").write(json.dumps(row) + "\n")
PY

      if [ "$arm" = current ]; then
        if [ "$ok" -eq 1 ]; then
          CURRENT_PASS=$((CURRENT_PASS + 1))
        else
          CURRENT_FAIL=$((CURRENT_FAIL + 1))
          if [ "$must_pass" = 1 ]; then
            CANARY_FAILED=1
          fi
        fi
      else
        if [ "$ok" -eq 1 ]; then
          BASELINE_PASS=$((BASELINE_PASS + 1))
        else
          BASELINE_FAIL=$((BASELINE_FAIL + 1))
        fi
      fi
    done
  done

  if [ "$CANARY_FAILED" -eq 1 ]; then
    printf '\nCanary failed on current — aborting remaining cases (guidance not loaded).\n' >&2
    break
  fi
done

python3 - "$RUN_DIR/results.ndjson" "$SUMMARY" "$CURRENT_PASS" "$CURRENT_FAIL" "$BASELINE_PASS" "$BASELINE_FAIL" "$RUN_ID" <<'PY'
import json, sys, pathlib
ndjson, summary, c_pass, c_fail, b_pass, b_fail, run_id = sys.argv[1:8]
rows = []
if pathlib.Path(ndjson).exists():
    rows = [json.loads(l) for l in open(ndjson, encoding="utf-8") if l.strip()]
by_case = {}
for r in rows:
    by_case.setdefault(r["case"], {}).setdefault(r["arm"], []).append(r["ok"])
# Discriminating = current all-pass and baseline any-fail for that case
deltas = {}
for case, arms in by_case.items():
    cur = arms.get("current") or []
    base = arms.get("baseline") or []
    if cur and base:
        deltas[case] = {
            "current_pass": all(cur),
            "baseline_pass": all(base),
            "guidance_helps": all(cur) and not all(base),
            "too_easy": all(cur) and all(base),
        }
report = {
    "run_id": run_id,
    "current": {"passed": int(c_pass), "failed": int(c_fail)},
    "baseline": {"passed": int(b_pass), "failed": int(b_fail)},
    "deltas": deltas,
    "cases": {
        c: {arm: {"pass": sum(1 for x in v if x), "n": len(v)} for arm, v in arms.items()}
        for c, arms in by_case.items()
    },
}
json.dump(report, open(summary, "w", encoding="utf-8"), indent=2)
print(json.dumps(report, indent=2))
for case, d in deltas.items():
    if d.get("too_easy"):
        print(
            f"note: {case} passed on baseline too — tighten the prompt "
            "(ask for a non-guessable rule fact).",
            file=sys.stderr,
        )
PY

printf '\nsummary: %s\n' "$SUMMARY"
# Gate on the current harness only. Baseline failures are the desired signal
# that guidance (not the base model) is carrying the case.
if [ "$CURRENT_FAIL" -gt 0 ]; then
  exit 1
fi
exit 0

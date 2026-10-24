#!/usr/bin/env bash
set -euo pipefail
answer="${1:?answer.json}"
python3 - "$answer" <<'PY'
import json, sys
data = json.load(open(sys.argv[1], encoding="utf-8"))
ok = (
    data.get("query_hooks_call_addNotification") is False
    and data.get("preferred_api") == "mutate"
    and data.get("toast_callbacks") == "hook_level"
)
if not ok:
    print(
        "expected query_hooks_call_addNotification=false, preferred_api=mutate, "
        f"toast_callbacks=hook_level, got {data!r}",
        file=sys.stderr,
    )
    sys.exit(1)
print("ok: toastr rule")
PY

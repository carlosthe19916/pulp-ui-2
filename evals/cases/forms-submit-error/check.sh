#!/usr/bin/env bash
set -euo pipefail
answer="${1:?answer.json}"
python3 - "$answer" <<'PY'
import json, sys
data = json.load(open(sys.argv[1], encoding="utf-8"))
adr = str(data.get("implements_adr", "")).strip()
ok = (
    data.get("also_raise_danger_toast") is False
    and data.get("close_modal") is False
    and adr
    in {
        "docs/adr/0008-async-task-feedback.md",
        "0008-async-task-feedback.md",
    }
)
if not ok:
    print(
        "expected also_raise_danger_toast=false, close_modal=false, "
        f"implements ADR 0008, got {data!r}",
        file=sys.stderr,
    )
    sys.exit(1)
print("ok: in-form only + ADR 0008")
PY

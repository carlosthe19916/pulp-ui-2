#!/usr/bin/env bash
set -euo pipefail
answer="${1:?answer.json}"
python3 - "$answer" <<'PY'
import json, sys
data = json.load(open(sys.argv[1], encoding="utf-8"))
path = str(data.get("shared_hook_dir", "")).strip().rstrip("/")
ok = (
    path in {"client/src/app/hooks", "@app/hooks"}
    and data.get("allow_pages_content_management_hooks") is False
)
if not ok:
    print(
        "expected shared_hook_dir=client/src/app/hooks and "
        f"allow_pages_content_management_hooks=false, got {data!r}",
        file=sys.stderr,
    )
    sys.exit(1)
print(f"ok: {path}")
PY

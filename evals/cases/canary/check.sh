#!/usr/bin/env bash
# Grade canary: expect {"command":"npm run rules"} (or bare "rules").
set -euo pipefail
answer="${1:?answer.json}"
python3 - "$answer" <<'PY'
import json, sys
data = json.load(open(sys.argv[1], encoding="utf-8"))
cmd = str(data.get("command", "")).strip()
ok = cmd in {"npm run rules", "rules"}
if not ok:
    print(f"expected command 'npm run rules', got {cmd!r}", file=sys.stderr)
    sys.exit(1)
print(f"ok: {cmd}")
PY

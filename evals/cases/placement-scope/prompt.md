You are answering from **this repository's** written conventions only.
You must open and read `.rulesync/rules/placement.md` or `.claude/rules/placement.md`
before answering. If that file is missing, say you cannot answer from repo rules.

A new hook will be used by both `repository-list` and `repository-detail`.

Reply with **only** a single JSON object — no markdown fences, no prose:

{"shared_hook_dir":"<repo-relative directory>","allow_pages_content_management_hooks":true|false}

- `shared_hook_dir`: where that shared hook file's directory must be
- `allow_pages_content_management_hooks`: whether
  `client/src/app/pages/content-management/hooks/` is allowed for it

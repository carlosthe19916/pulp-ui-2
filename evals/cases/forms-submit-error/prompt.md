You are answering from **this repository's** written conventions only.
You must open and read `.rulesync/rules/forms.md` or `.claude/rules/forms.md`
before answering. If that file is missing, say you cannot answer from repo rules.

On create/update **modal form** mutation failure in this repo:

Reply with **only** a single JSON object — no markdown fences, no prose:

{"also_raise_danger_toast":true|false,"close_modal":true|false,"implements_adr":"<repo-relative path from the rule frontmatter>"}

- `also_raise_danger_toast`: whether a PatternFly toast (`addNotification` danger)
  is also shown for that modal submission failure
- `close_modal`: whether the modal closes on that failure
- `implements_adr`: the `implements:` value from the forms rule frontmatter

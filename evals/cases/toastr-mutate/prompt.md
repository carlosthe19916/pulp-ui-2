You are answering from **this repository's** written conventions only.
You must open and read `.rulesync/rules/toastr.md` or `.claude/rules/toastr.md`
before answering. If that file is missing, say you cannot answer from repo rules.

Reply with **only** a single JSON object — no markdown fences, no prose:

{"query_hooks_call_addNotification":true|false,"preferred_api":"mutate"|"mutateAsync","toast_callbacks":"hook_level"|"call_level"}

Meanings (as defined in the toastr rule):

- `query_hooks_call_addNotification`: may shared query/mutation hooks under
  `client/src/app/queries/` call `addNotification` for create/update success?
- `preferred_api`: `mutate` vs `mutateAsync` for feature code
- `toast_callbacks`: where success/error toast callbacks must be registered so
  they still run after unmount (`hook_level` = `useMutation({ onSuccess })`,
  `call_level` = `mutate(vars, { onSuccess })`)

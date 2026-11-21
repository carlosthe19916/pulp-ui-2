---
paths:
  - client/src/ai/**
  - server/src/ai.ts
  - common/src/ai.ts
  - common/src/environment.ts
  - common/src/index.ts
---

# AI assistant (2.x)

[ADR 0019](../../docs/adr/0019-ai-assistant.md) decides what the assistant does. In code it is
CopilotKit: a runtime in the UI server (`server/src/ai.ts`) holding the operator's provider, and
frontend tools in the browser (`client/src/ai/`) that read Pulp and draw the answers.

- **On only when configured.** `readAiConfig` (`@pulp-ui/common`) alone decides, from the
  `AI_*` variables. They stay in `SERVER_ENV_KEYS`; the browser reads only `AI_ENABLED`, which
  `buildPulpEnv` derives from them. The layout lazy-loads `client/src/ai` only when it is
  `"true"`, so nothing there may be imported eagerly.
- **The runtime** is mounted only then, at `/copilotkit` (outside `/api`) with `cors: false`, using
  CopilotKit's Node handler, not its Express adapter (which loads `express` at runtime; the image
  has no `node_modules`). It allows only the routes the chat uses.
- **Tools** are `useFrontendTool` from `@copilotkit/react-core/v2` with a zod schema. The handler
  reads through the app's `*QueryOptions` (`queryClient.query`) and returns the model a short
  summary; the `render` draws app components from the same query, once the arguments are complete
  (not `ToolCallStatus.InProgress`). Never render markup the model wrote.
- **Read-only, as the user.** Tools call Pulp from the browser with the user's session; the server
  never calls Pulp. A tool that changes anything needs a new ADR.

## Layout of `client/src/ai/`

```
ai/
  index.ts              # the only import from outside: AiAssistant
  AiAssistant.tsx       # CopilotKit provider; mounts the chat, the context and the tools
  AssistantChat/        # the PatternFly chat (component folder)
  context/              # what the assistant knows: one hook per kind of context
  tools/
    index.ts            # useAssistantTools(): every tool, in one list
    repositories/       # one folder per Pulp entity: its tools, their result components, tests
```

- A new tool goes in its entity's folder under `tools/` (a new folder for a new entity) and is
  added to `useAssistantTools`. Every tool is sent to the model on every request, so keep the list
  short and the descriptions precise.
- A result component used by one tool stays in its folder; one shared by two entities moves to
  `ai/components/`. App-wide pieces stay in `@app/components`.

## Checklist

Pass/fail rubric for `/eval`. Check changed files under `client/src/ai/`, `server/src/ai.ts` and
the `AI_*` settings.

- [ ] Whether AI is on comes only from `readAiConfig`; the browser reads only `AI_ENABLED`.
- [ ] `client/src/ai` is reached only through the layout's lazy import; new tools live in their
      entity's folder under `tools/` and are listed in `useAssistantTools`.
- [ ] Tools are v2 `useFrontendTool`s whose `render` draws app components after the arguments
      are complete, and whose handler only reads.
- [ ] The runtime stays at `/copilotkit` with `cors: false`, the Node handler and its allowed
      routes.

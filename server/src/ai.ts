// Must stay first: it sets the telemetry opt-out before CopilotKit loads.
import "./disableAiTelemetry.js";

import { createOpenAI } from "@ai-sdk/openai";
import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2";
import { createCopilotNodeHandler } from "@copilotkit/runtime/v2/node";

import type { IAiConfig } from "@pulp-ui/common";

/** Where the browser reaches the assistant; outside `/api`, which is proxied to Pulp. */
export const AI_RUNTIME_PATH = "/copilotkit";

/** Matches the runtime's routes for `app.all`, which keeps the full path. */
export const AI_RUNTIME_ROUTE = /^\/copilotkit(\/.*)?$/;

const SYSTEM_PROMPT = `You are the assistant of the Pulp web UI, which manages software
repositories, remotes, distributions and content in Pulp.
- You can only read. Never say that you created, changed, deleted or started anything.
- Use your tools to look things up and show results; don't invent names or values.
- When a tool shows results, answer in one or two short sentences instead of repeating them.
- If a tool says the user isn't allowed to read something, tell them so.`;

/** The routes the chat uses; threads, memories, transcription and the inspector stay closed. */
const ALLOWED_ROUTES = new Set([
  "info",
  "agent/run",
  "agent/connect",
  "agent/stop",
]);

const buildModel = (config: IAiConfig) =>
  config.provider === "openai-compatible"
    ? // Most compatible hosts (Ollama, vLLM, gateways) serve Chat Completions, not Responses.
      createOpenAI({
        apiKey: config.apiKey ?? "not-needed",
        baseURL: config.baseUrl,
      }).chat(config.model)
    : `${config.provider}:${config.model}`;

/**
 * Request handler serving the assistant's runtime. Not CopilotKit's Express adapter: it loads
 * `express` at runtime, and the image ships without `node_modules`.
 */
export const createAiHandler = (config: IAiConfig) => {
  const runtime = new CopilotRuntime({
    agents: {
      default: new BuiltInAgent({
        model: buildModel(config),
        apiKey: config.apiKey,
        prompt: SYSTEM_PROMPT,
        // A frontend tool call, then the answer.
        maxSteps: 5,
        maxOutputTokens: 2048,
        // Never fetch URLs that appear in messages.
        urlDownload: "disabled",
      }),
    },
    // Conversations live only in memory; keep far less than the default 512 MB.
    runner: new InMemoryAgentRunner({
      maxThreads: 100,
      maxRunsPerThread: 50,
      maxBytes: 32 * 1024 ** 2,
    }),
  });

  return createCopilotNodeHandler(
    createCopilotRuntimeHandler({
      runtime,
      basePath: AI_RUNTIME_PATH,
      // Same origin only: the browser reaches it through the UI server.
      cors: false,
      hooks: {
        onBeforeHandler: ({ route }) => {
          if (!ALLOWED_ROUTES.has(route.method)) {
            throw new Response("Not found", { status: 404 });
          }
        },
        onError: ({ error }) => {
          console.error("AI assistant:", error);
          return Response.json(
            { error: "The AI assistant failed; see the Pulp UI server log." },
            { status: 500 },
          );
        },
      },
    }),
  );
};

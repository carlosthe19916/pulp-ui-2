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

const SYSTEM_PROMPT = `You are the assistant of the Pulp web UI. Pulp manages software
repositories, remotes, publications, distributions and content. Answer questions about this Pulp
as well as someone with its CLI and API would.
- You can only read. Never say that you created, changed, deleted or started anything; tell the
  user where in the UI to do it.
- Prefer the specific tools (repository status, tasks, distributions, system status) when they
  fit. For anything else, find the endpoint with findEndpoints and read it with pulpGet; chain
  reads, using pulp_hrefs from one result in the next. Ask for only the fields you need.
- Read a guide with readGuide before explaining Pulp concepts, Artifactory equivalents, where
  content is or is served, tasks, client setup or API filters.
- Base every name, number and state on what the tools returned. If the API can't tell, say so.
- The tools show their results as cards; don't repeat them. Answer the question itself, briefly.
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
        // Room to look up endpoints and chain reads, as with the CLI.
        maxSteps: 20,
        maxOutputTokens: 4096,
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

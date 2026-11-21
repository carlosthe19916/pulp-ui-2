import type { PulpEnvType } from "./environment.js";

/** LLM providers the AI assistant can use; `openai-compatible` covers self-hosted models. */
export const AI_PROVIDERS = [
  "openai",
  "anthropic",
  "google",
  "openai-compatible",
] as const;

export type AiProvider = (typeof AI_PROVIDERS)[number];

export interface IAiConfig {
  provider: AiProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface IAiConfigResult {
  /** The provider to use, or `null` when the AI features are off. */
  config: IAiConfig | null;
  /** Why a partial configuration was rejected; the AI features then stay off. */
  problem: string | null;
}

const isHttpUrl = (value: string) =>
  URL.canParse(value) && ["http:", "https:"].includes(new URL(value).protocol);

const isAiProvider = (value: string): value is AiProvider =>
  (AI_PROVIDERS as readonly string[]).includes(value);

/** The operator's LLM provider from the `AI_*` variables. Nothing set means AI off. */
export const readAiConfig = (env: Partial<PulpEnvType>): IAiConfigResult => {
  const provider = env.AI_PROVIDER?.trim() || undefined;
  const model = env.AI_MODEL?.trim() || undefined;
  const apiKey = env.AI_API_KEY?.trim() || undefined;
  const baseUrl = env.AI_BASE_URL?.trim() || undefined;

  if (!provider && !model && !apiKey && !baseUrl) {
    return { config: null, problem: null };
  }
  if (!provider || !isAiProvider(provider)) {
    return {
      config: null,
      problem: `AI_PROVIDER must be one of: ${AI_PROVIDERS.join(", ")}`,
    };
  }
  if (!model) {
    return { config: null, problem: "AI_MODEL is required" };
  }
  if (baseUrl && !isHttpUrl(baseUrl)) {
    return { config: null, problem: "AI_BASE_URL must be an http(s) URL" };
  }
  if (provider === "openai-compatible" && !baseUrl) {
    return {
      config: null,
      problem: "AI_BASE_URL is required for the openai-compatible provider",
    };
  }
  if (provider !== "openai-compatible" && !apiKey) {
    return {
      config: null,
      problem: `AI_API_KEY is required for the ${provider} provider`,
    };
  }
  return { config: { provider, model, apiKey, baseUrl }, problem: null };
};

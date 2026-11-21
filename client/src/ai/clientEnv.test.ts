import {
  buildPulpEnv,
  decodeEnv,
  encodeEnv,
  readAiConfig,
  SERVER_ENV_KEYS,
} from "@pulp-ui/common";
import { describe, expect, it } from "vitest";

// common has no test runner, so its AI settings are tested here, where the browser reads them.
describe("readAiConfig", () => {
  it("leaves AI off when nothing is set", () => {
    expect(readAiConfig({})).toEqual({ config: null, problem: null });
  });

  it("accepts a self-hosted model with a base URL and no key", () => {
    expect(
      readAiConfig({
        AI_PROVIDER: "openai-compatible",
        AI_MODEL: "granite",
        AI_BASE_URL: "http://localhost:11434/v1",
      }).config?.provider,
    ).toBe("openai-compatible");
  });

  it.each([
    [{ AI_PROVIDER: "acme", AI_MODEL: "m" }, "AI_PROVIDER must be one of"],
    [{ AI_PROVIDER: "openai", AI_MODEL: "m" }, "AI_API_KEY is required"],
    [
      { AI_PROVIDER: "openai-compatible", AI_MODEL: "m" },
      "AI_BASE_URL is required",
    ],
  ])("leaves AI off for an incomplete setup %o", (env, problem) => {
    const result = readAiConfig(env);
    expect(result.config).toBeNull();
    expect(result.problem).toContain(problem);
  });
});

describe("the env the browser gets", () => {
  const serverEnv = buildPulpEnv({
    AI_PROVIDER: "anthropic",
    AI_MODEL: "claude",
    AI_API_KEY: "sk-secret",
  });
  const sent = encodeEnv(serverEnv, SERVER_ENV_KEYS);

  it("says AI is on, never the provider settings or key", () => {
    expect(decodeEnv(sent)).toMatchObject({ AI_ENABLED: "true" });
    expect(atob(sent)).not.toMatch(/AI_PROVIDER|AI_MODEL|AI_API_KEY|sk-secret/);
  });

  it("keeps AI on in the browser, which gets no AI_* values", () => {
    expect(buildPulpEnv(decodeEnv(sent)).AI_ENABLED).toBe("true");
  });

  it("says AI is off for an incomplete setup", () => {
    expect(
      buildPulpEnv({ AI_PROVIDER: "openai", AI_MODEL: "gpt" }).AI_ENABLED,
    ).toBe("false");
  });
});

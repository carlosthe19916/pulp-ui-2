import { describe, expect, it } from "vitest";

import { PLUGIN_DEFINITIONS } from "@catalog";
import type {
  ActionResponseKind,
  IPluginDefinition,
} from "@plugin-sdk/definition";

import specSource from "../../openapi/pulp.json?raw";

interface IOperation {
  responses?: Record<
    string,
    { content?: Record<string, { schema?: { $ref?: string } }> }
  >;
}

const spec = JSON.parse(specSource) as {
  info: { "x-pulp-app-versions": Record<string, string> };
  paths: Record<string, { post?: IOperation }>;
};
const paths = spec.paths;
const V3 = "/api/pulp/{pulp_domain}/api/v3/";
const V3_NO_DOMAIN = "/api/pulp/api/v3/";

/** Whether the spec's plugin predates `minimum`, by numeric parts. */
const specPredates = ({
  pluginId,
  minimum,
}: {
  pluginId: string;
  minimum: string;
}) => {
  const parts = (v: string) =>
    v.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const [have, need] = [
    parts(spec.info["x-pulp-app-versions"][pluginId] ?? "0"),
    parts(minimum),
  ];
  for (let i = 0; i < Math.max(have.length, need.length); i++) {
    const diff = (have[i] ?? 0) - (need[i] ?? 0);
    if (diff !== 0) return diff < 0;
  }
  return false;
};
const definitions: readonly IPluginDefinition[] = PLUGIN_DEFINITIONS;

/** The status codes and response schemas a POST declares, e.g. `202 AsyncOperationResponse`. */
const declaredResponses = (path: string): string[] =>
  Object.entries(paths[path]?.post?.responses ?? {}).map(([code, response]) => {
    const ref = Object.values(response.content ?? {})[0]?.schema?.$ref;
    return `${code} ${ref?.split("/").pop() ?? ""}`.trim();
  });

const MATCHES_DECLARED: Record<
  ActionResponseKind,
  (responses: string[]) => boolean
> = {
  task: (responses) =>
    responses.length === 1 && responses[0] === "202 AsyncOperationResponse",
  taskGroup: (responses) =>
    responses.length === 1 && responses[0] === "202 TaskGroupOperationResponse",
  inline: (responses) =>
    responses.length === 1 && responses[0]?.startsWith("200 ") === true,
};

/** Where an action posts, as the spec keys it (`{rpm_rpm_repository_href}sync/`). */
const actionPath = (
  repositoryApiPath: string,
  action: { path: string; target: "repository" | "version" },
) =>
  action.path.startsWith("/")
    ? `${V3}${action.path.slice(1)}`
    : `{${repositoryApiPath.replace(/[/-]/g, "_")}_repository${
        action.target === "version" ? "_version" : ""
      }_href}${action.path}`;

/** The definitions agree with what the OpenAPI spec declares each endpoint answers. */
describe.each(definitions.map((definition) => [definition.id, definition]))(
  "plugin %s against the OpenAPI spec",
  (_id, definition) => {
    it("declares what each repository action answers", () => {
      for (const repository of Object.values(definition.repository ?? {})) {
        for (const [key, action] of Object.entries(repository.actions ?? {})) {
          const minimum = action.domainScopedSince;
          if (minimum && specPredates({ pluginId: definition.id, minimum })) {
            // The spec's plugin serves it only outside a domain, which is why it is gated.
            const outside = `${V3_NO_DOMAIN}${action.path.slice(1)}`;
            expect(
              declaredResponses(actionPath(repository.apiPath, action)),
              `${key} is gated from ${minimum} but the spec already serves it in a domain`,
            ).toEqual([]);
            expect(
              declaredResponses(outside).length,
              `${key} is gated from ${minimum} but ${outside} is missing`,
            ).toBe(1);
            continue;
          }
          const path = actionPath(repository.apiPath, action);
          const responseKind = action.responseKind ?? "task";
          expect(
            MATCHES_DECLARED[responseKind](declaredResponses(path)),
            `${key} (${path}) is "${responseKind}", the spec declares ${declaredResponses(path).join(", ") || "nothing"}`,
          ).toBe(true);
        }
      }
    });

    it("uploads content by the mechanism its endpoint answers", () => {
      for (const [pulpType, content] of Object.entries(
        definition.content ?? {},
      )) {
        if (!content.upload || !content.apiPath) continue;
        const path =
          content.upload === "upload"
            ? `${V3}content/${content.apiPath}/upload/`
            : `${V3}content/${content.apiPath}/`;
        const responses = declaredResponses(path);
        const expected =
          content.upload === "upload"
            ? responses.length === 1 && responses[0]?.startsWith("201 ")
            : MATCHES_DECLARED.task(responses);
        expect(
          expected,
          `${pulpType} "${content.upload}" (${path}): the spec declares ${responses.join(", ") || "nothing"}`,
        ).toBe(true);
      }
    });
  },
);

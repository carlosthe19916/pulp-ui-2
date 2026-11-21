import type { StatusResponse } from "@app/client";

export interface IVersionMismatch {
  app: string;
  component: string;
  expected: string;
  actual: string | null;
}

/**
 * Apps whose installed versions differ from the API's: a worker on another version may
 * refuse tasks, leaving them waiting.
 */
export const versionMismatches = (
  status: StatusResponse,
): IVersionMismatch[] => {
  const expected = new Map(
    status.versions.map((version) => [version.component, version.version]),
  );
  return [
    ...status.online_workers,
    ...status.online_api_apps,
    ...status.online_content_apps,
  ].flatMap((app) =>
    Object.entries(app.versions ?? {})
      .filter(
        ([component, actual]) =>
          expected.has(component) && expected.get(component) !== actual,
      )
      .map(([component, actual]) => ({
        app: app.name ?? "unknown",
        component,
        expected: expected.get(component) ?? "",
        actual,
      })),
  );
};

/** Only superusers may list workers; status/ reports online ones to everyone. */
export const MISSING_WORKERS_PARAMS = { limit: 1, missing: true } as const;

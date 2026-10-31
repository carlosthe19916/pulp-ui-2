import { describe, expect, it } from "vitest";

import type { VersionResponse } from "@app/client";
import { getAvailablePlugins, getContentTypes } from "@catalog";

import { REPOSITORY_ACTION_FIELDS } from "./actions";
import { getUploadFields, UPLOAD_FIELDS } from "./uploads";

const ALL_INSTALLED = [
  "ansible",
  "container",
  "core",
  "deb",
  "file",
  "gem",
  "maven",
  "npm",
  "ostree",
  "python",
  "rpm",
  "hugging_face",
].map((component) => ({ component, version: "1.0.0" }) as VersionResponse);

const actions = getAvailablePlugins({
  entity: "repository",
  installed: ALL_INSTALLED,
}).flatMap((plugin) =>
  (plugin.entities.repository?.actions ?? []).map((action) => ({
    repositoryType: plugin.pulpType,
    actionKey: action.key,
  })),
);

const uploadable = getContentTypes({ installed: ALL_INSTALLED })
  .filter((contentType) => contentType.uploadable)
  .map((contentType) => contentType.pulpType);

describe("action and upload fields", () => {
  it.each(actions)(
    "$repositoryType action $actionKey declares its fields",
    ({ repositoryType, actionKey }) => {
      expect(
        REPOSITORY_ACTION_FIELDS[repositoryType]?.[actionKey],
      ).toBeDefined();
    },
  );

  it.each(uploadable)("uploadable %s declares its fields", (contentType) => {
    expect(UPLOAD_FIELDS[contentType]).toBeDefined();
  });

  it("asks for a relative path when uploading a Maven artifact", () => {
    expect(getUploadFields("maven.artifact").map((field) => field.key)).toEqual(
      ["relative_path"],
    );
  });
});

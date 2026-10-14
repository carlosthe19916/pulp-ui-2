import { describe, expect, it } from "vitest";

import {
  type RepositoryFormValues,
  valuesToCreate,
  valuesToPatch,
} from "./RepositoryForm";

const baseValues: RepositoryFormValues = {
  name: "my-repo",
  description: "a repo",
  retain_repo_versions: 5,
  remote: "/pulp/api/v3/remotes/file/file/abc/",
  autopublish: true,
};

describe("valuesToCreate", () => {
  it("maps the typed base plus plugin extras", () => {
    expect(
      valuesToCreate({ ...baseValues, manifest: "PULP_MANIFEST" }),
    ).toEqual({
      name: "my-repo",
      description: "a repo",
      retain_repo_versions: 5,
      remote: "/pulp/api/v3/remotes/file/file/abc/",
      autopublish: true,
      manifest: "PULP_MANIFEST",
    });
  });

  it("coerces an empty-string retain_repo_versions to an omitted field", () => {
    const result = valuesToCreate({ ...baseValues, retain_repo_versions: "" });
    expect(result).not.toHaveProperty("retain_repo_versions");
  });

  it("coerces a numeric-string retain_repo_versions to a number", () => {
    const result = valuesToCreate({ ...baseValues, retain_repo_versions: "7" });
    expect(result.retain_repo_versions).toBe(7);
  });

  it("drops empty/undefined/null optionals but keeps false booleans", () => {
    const result = valuesToCreate({
      name: "r",
      description: "",
      remote: undefined,
      retain_repo_versions: null,
      autopublish: false,
    });
    expect(result).toEqual({ name: "r", autopublish: false });
  });
});

describe("valuesToPatch", () => {
  it("normalizes the same way as create (no create-only fields)", () => {
    expect(valuesToPatch(baseValues)).toEqual(valuesToCreate(baseValues));
  });

  it("omits fields the user left blank so a PATCH doesn't null them", () => {
    const result = valuesToPatch({ name: "r", description: "", remote: "" });
    expect(result).toEqual({ name: "r" });
  });
});

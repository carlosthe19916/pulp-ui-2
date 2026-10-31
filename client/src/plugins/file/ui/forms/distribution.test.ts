import { describe, expect, it } from "vitest";

import {
  buildCreateBody,
  buildPatchBody,
} from "@app/plugin-forms/kit/derive/body";
import { buildDefaultValues } from "@app/plugin-forms/kit/derive/defaults";

import { fileDistributionForm } from "./distribution";

const PUBLICATION = "/pulp/api/v3/publications/file/file/1/";
const REPOSITORY = "/pulp/api/v3/repositories/file/file/2/";

const entity = {
  name: "stable",
  base_path: "files/stable",
  publication: PUBLICATION,
  repository: null,
  repository_version: null,
};

describe("distribution source choice", () => {
  it("starts on the source the distribution serves", () => {
    const values = buildDefaultValues({
      form: fileDistributionForm,
      mode: "edit",
      entity,
    });
    expect(values.$source).toBe("publication");
  });

  it("clears the old source when an edit switches to another", () => {
    const initialValues = buildDefaultValues({
      form: fileDistributionForm,
      mode: "edit",
      entity,
    });
    expect(
      buildPatchBody({
        form: fileDistributionForm,
        values: {
          ...initialValues,
          $source: "repository",
          repository: REPOSITORY,
        },
        initialValues,
        entity,
      }),
    ).toEqual({ repository: REPOSITORY, publication: null });
  });

  it("sends only the chosen source on create, never the choice itself", () => {
    const values = {
      ...buildDefaultValues({ form: fileDistributionForm, mode: "create" }),
      name: "stable",
      base_path: "files/stable",
      $source: "publication",
      publication: PUBLICATION,
      repository: REPOSITORY,
    };
    expect(buildCreateBody({ form: fileDistributionForm, values })).toEqual({
      name: "stable",
      base_path: "files/stable",
      publication: PUBLICATION,
      checkpoint: false,
      hidden: false,
    });
  });
});

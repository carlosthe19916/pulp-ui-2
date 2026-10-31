import type React from "react";
import { useState } from "react";

import { Split, SplitItem } from "@patternfly/react-core";

import { AsyncResourceSelect } from "@app/components/AsyncResourceSelect";
import { VersionSelect } from "@app/components/VersionSelect";

import type { ICustomFieldProps } from "../types";

/** A version href's repository: `…/repositories/<app>/<slug>/<id>/versions/<n>/`. */
const repositoryOf = (versionHref: string): string =>
  versionHref.replace(/versions\/\d+\/$/, "");

/**
 * A `custom` field picking one repository version: a repository (of `pulpTypes`), then one of
 * its versions. The value is the version's href.
 */
export const makeRepositoryVersionField = ({
  pulpTypes,
}: {
  pulpTypes: string[];
}): React.FC<ICustomFieldProps> => {
  const RepositoryVersionField: React.FC<ICustomFieldProps> = ({
    id,
    value,
    onChange,
  }) => {
    const versionHref = typeof value === "string" ? value : "";
    const [repositoryHref, setRepositoryHref] = useState(() =>
      versionHref ? repositoryOf(versionHref) : "",
    );
    return (
      <Split hasGutter>
        <SplitItem isFilled>
          <AsyncResourceSelect
            id={id}
            label="Repository"
            resourceKind="repository"
            pulpTypes={pulpTypes}
            value={repositoryHref}
            onChange={(next) => {
              setRepositoryHref(next);
              onChange("");
            }}
          />
        </SplitItem>
        <SplitItem isFilled>
          <VersionSelect
            id={`${id}-version`}
            label="Version"
            repositoryHref={repositoryHref}
            value={versionHref}
            onChange={onChange}
            isToggleFullWidth
          />
        </SplitItem>
      </Split>
    );
  };
  return RepositoryVersionField;
};

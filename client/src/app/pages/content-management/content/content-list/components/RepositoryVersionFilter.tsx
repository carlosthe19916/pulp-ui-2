import type React from "react";
import { useState } from "react";

import {
  Flex,
  FlexItem,
  ToggleGroup,
  ToggleGroupItem,
  ToolbarFilter,
  type ToolbarLabel,
} from "@patternfly/react-core";

import { AsyncResourceSelect } from "@app/components/AsyncResourceSelect";

import {
  decodeRepositoryVersion,
  encodeRepositoryVersion,
  type VersionRelation,
} from "./versionFilterCodec";
import { VersionSelect } from "./VersionSelect";

const RELATION_LABEL: Record<VersionRelation, string> = {
  in: "In version",
  added: "Added in version",
  removed: "Removed in version",
};

interface IRepositoryVersionFilterProps {
  filterId: string;
  title: string;
  value?: string;
  onChange?: (event: unknown, value: string) => void;
  showToolbarItem?: boolean;
}

/**
 * Filter content by a repository version: pick a repository + version and whether to show
 * content present in / added in / removed in that version. Rendered as inline toolbar controls
 * (a relation toggle, a repository typeahead, and a version select) rather than a popover — the
 * repository/version menus are themselves overlays, so nesting them inside a popover would close
 * it on selection. Composed into `DataViewFilters` like `MultiSelectFilter` (renders a
 * `ToolbarFilter`, carries `filterId`/`title`, uses the injected `value`/`onChange`/`showToolbarItem`).
 */
export const RepositoryVersionFilter: React.FC<
  IRepositoryVersionFilterProps
> = ({ filterId, title, value = "", onChange, showToolbarItem }) => {
  const [repositoryHref, setRepositoryHref] = useState("");
  const { relation, versionHref } = decodeRepositoryVersion(value);

  const emit = (next: { relation: VersionRelation; versionHref: string }) =>
    onChange?.(undefined, encodeRepositoryVersion(next));

  const labels: ToolbarLabel[] = versionHref
    ? [{ key: value, node: RELATION_LABEL[relation] }]
    : [];

  return (
    <ToolbarFilter
      labels={labels}
      deleteLabel={() => onChange?.(undefined, "")}
      categoryName={title}
      showToolbarItem={showToolbarItem}
    >
      <Flex
        spaceItems={{ default: "spaceItemsSm" }}
        alignItems={{ default: "alignItemsCenter" }}
        flexWrap={{ default: "nowrap" }}
      >
        <FlexItem>
          <ToggleGroup aria-label="Version relation">
            {(Object.keys(RELATION_LABEL) as VersionRelation[]).map((r) => (
              <ToggleGroupItem
                key={r}
                text={RELATION_LABEL[r]}
                isSelected={relation === r}
                onChange={() => emit({ relation: r, versionHref })}
              />
            ))}
          </ToggleGroup>
        </FlexItem>
        <FlexItem>
          <AsyncResourceSelect
            id={`${filterId}-repository`}
            label="Repository"
            resourceKind="repository"
            value={repositoryHref}
            onChange={(next) => {
              setRepositoryHref(next);
              emit({ relation, versionHref: "" });
            }}
          />
        </FlexItem>
        <FlexItem>
          <VersionSelect
            id={`${filterId}-version`}
            label="Version"
            repositoryHref={repositoryHref}
            value={versionHref}
            onChange={(href) => emit({ relation, versionHref: href })}
          />
        </FlexItem>
      </Flex>
    </ToolbarFilter>
  );
};

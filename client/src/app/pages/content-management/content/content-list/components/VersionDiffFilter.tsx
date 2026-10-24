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
  decodeVersionDiff,
  encodeVersionDiff,
  type DiffRelation,
} from "../utils/versionFilterCodec";
import { VersionSelect } from "./VersionSelect";

const RELATION_LABEL: Record<DiffRelation, string> = {
  added: "Added between",
  removed: "Removed between",
};

interface IVersionDiffFilterProps {
  filterId: string;
  title: string;
  value?: string;
  onChange?: (event: unknown, value: string) => void;
  showToolbarItem?: boolean;
}

/**
 * Filter content by what was added/removed between two versions of one repository
 * (`added_between` / `removed_between`, a comma-joined `base,target` pair). Rendered as inline
 * toolbar controls (relation toggle, repository typeahead, base + target version selects).
 *
 * Base/target are picked in separate steps, so they're held in local state and only encoded into
 * the filter value once BOTH are chosen — deriving them from the (both-required) encoded value
 * alone would discard the first selection.
 */
export const VersionDiffFilter: React.FC<IVersionDiffFilterProps> = ({
  filterId,
  title,
  value = "",
  onChange,
  showToolbarItem,
}) => {
  const decoded = decodeVersionDiff(value);
  const [repositoryHref, setRepositoryHref] = useState("");
  const [relation, setRelation] = useState<DiffRelation>(decoded.relation);
  const [baseHref, setBaseHref] = useState(decoded.baseHref);
  const [targetHref, setTargetHref] = useState(decoded.targetHref);

  const emit = (next: {
    relation: DiffRelation;
    base: string;
    target: string;
  }) =>
    onChange?.(
      undefined,
      encodeVersionDiff({
        relation: next.relation,
        baseHref: next.base,
        targetHref: next.target,
      }),
    );

  const labels: ToolbarLabel[] =
    baseHref && targetHref
      ? [{ key: value || "diff", node: RELATION_LABEL[relation] }]
      : [];

  return (
    <ToolbarFilter
      labels={labels}
      deleteLabel={() => {
        setBaseHref("");
        setTargetHref("");
        onChange?.(undefined, "");
      }}
      categoryName={title}
      showToolbarItem={showToolbarItem}
    >
      <Flex
        spaceItems={{ default: "spaceItemsSm" }}
        alignItems={{ default: "alignItemsCenter" }}
        flexWrap={{ default: "nowrap" }}
      >
        <FlexItem>
          <ToggleGroup aria-label="Diff direction">
            {(Object.keys(RELATION_LABEL) as DiffRelation[]).map((r) => (
              <ToggleGroupItem
                key={r}
                text={RELATION_LABEL[r]}
                isSelected={relation === r}
                onChange={() => {
                  setRelation(r);
                  emit({ relation: r, base: baseHref, target: targetHref });
                }}
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
              setBaseHref("");
              setTargetHref("");
              emit({ relation, base: "", target: "" });
            }}
          />
        </FlexItem>
        <FlexItem>
          <VersionSelect
            id={`${filterId}-base`}
            label="Base version"
            repositoryHref={repositoryHref}
            value={baseHref}
            onChange={(href) => {
              setBaseHref(href);
              emit({ relation, base: href, target: targetHref });
            }}
          />
        </FlexItem>
        <FlexItem>
          <VersionSelect
            id={`${filterId}-target`}
            label="Target version"
            repositoryHref={repositoryHref}
            value={targetHref}
            onChange={(href) => {
              setTargetHref(href);
              emit({ relation, base: baseHref, target: href });
            }}
          />
        </FlexItem>
      </Flex>
    </ToolbarFilter>
  );
};

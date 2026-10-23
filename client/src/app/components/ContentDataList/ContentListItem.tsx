import type React from "react";

import {
  ClipboardCopy,
  Content,
  ContentVariants,
  DataListAction,
  DataListCell,
  DataListCheck,
  DataListContent,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  DataListToggle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
} from "@patternfly/react-core";

import {
  type PageHeaderAction,
  PageHeaderActionsMenu,
} from "@app/components/PageHeaderActionsMenu";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { formatDateTime } from "@app/utils/utils";

import type { IContentUnit } from "./types";

/** Max rendered width of a label chip before it truncates (with a tooltip). */
const LABEL_MAX_WIDTH = "20ch";

/** DOM-id-safe token derived from a unit's href (for toggle/content aria wiring). */
const rowKey = (href: string): string => href.replace(/[^a-zA-Z0-9]+/g, "-");

/** The `pulp_label_select` selector for a label entry: `key=value`, or `key` when valueless. */
const labelSelector = ([key, value]: [string, string | null]): string =>
  value == null ? key : `${key}=${value}`;

/** A dot separator between the small metadata items. */
const MetaDot: React.FC = () => (
  <Content component={ContentVariants.small} aria-hidden>
    ·
  </Content>
);

/** Expanded-row body: the row's own artifacts map — no extra REST call. */
const ArtifactsPanel: React.FC<{
  artifacts: Record<string, string | null>;
}> = ({ artifacts }) => {
  const entries = Object.entries(artifacts);
  if (entries.length === 0) {
    return <>No artifacts for this content unit.</>;
  }
  return (
    <DescriptionList isCompact>
      {entries.map(([relativePath, href]) => (
        <DescriptionListGroup key={relativePath}>
          <DescriptionListTerm>{relativePath}</DescriptionListTerm>
          <DescriptionListDescription>
            {href ? (
              <ClipboardCopy variant="inline-compact" isReadOnly>
                {href}
              </ClipboardCopy>
            ) : (
              "Not downloaded"
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>
      ))}
    </DescriptionList>
  );
};

interface IContentListItemProps {
  unit: IContentUnit;
  isExpanded: boolean;
  onToggle: () => void;
  /** Clicking a label sets the label filter to its `key=value` (or `key`) selector. */
  onLabelClick?: (selector: string) => void;
  isSelectable?: boolean;
  /** Bulk-selection checkbox; absent when the list isn't selectable. */
  check?: {
    isChecked: boolean;
    isDisabled: boolean;
    onChange: (checked: boolean) => void;
  };
  /** Row kebab actions. */
  actions?: PageHeaderAction[];
}

/**
 * One `DataList` row for a content unit: the full PRN (linked) as the title, a metadata line
 * (type · created · artifact count), right-aligned clickable labels, and an artifacts panel that
 * expands from the row's own data.
 */
export const ContentListItem: React.FC<IContentListItemProps> = ({
  unit,
  isExpanded,
  onToggle,
  onLabelClick,
  isSelectable,
  check,
  actions,
}) => {
  const href = unit.pulp_href ?? "";
  const key = rowKey(href);
  const labelId = `${key}-prn`;
  const contentId = `${key}-artifacts`;
  const pulpType = resolvePulpType(href);
  const artifacts = unit.artifacts ?? {};
  const artifactCount = Object.keys(artifacts).length;
  const labelEntries = Object.entries(unit.pulp_labels ?? {});

  return (
    <DataListItem id={href} isExpanded={isExpanded} aria-labelledby={labelId}>
      <DataListItemRow>
        <DataListToggle
          id={`${key}-toggle`}
          isExpanded={isExpanded}
          aria-controls={contentId}
          onClick={onToggle}
        />
        {check && (
          <DataListCheck
            id={`${key}-check`}
            aria-labelledby={labelId}
            isChecked={check.isChecked}
            isDisabled={check.isDisabled}
            onChange={(_event, checked) => check.onChange(checked)}
          />
        )}
        <DataListItemCells
          dataListCells={[
            <DataListCell key="primary" isFilled>
              <Flex
                direction={{ default: "column" }}
                spaceItems={{ default: "spaceItemsXs" }}
              >
                <FlexItem>
                  <span id={labelId}>
                    {isSelectable ? (
                      unit.prn
                    ) : (
                      <ResourceHrefLink
                        kind="content"
                        href={href}
                        label={unit.prn ?? undefined}
                      />
                    )}
                  </span>
                </FlexItem>
                {pulpType && (
                  <FlexItem>
                    <Content component={ContentVariants.small}>
                      {pulpType}
                    </Content>
                  </FlexItem>
                )}
                <FlexItem>
                  <Flex
                    spaceItems={{ default: "spaceItemsSm" }}
                    alignItems={{ default: "alignItemsCenter" }}
                  >
                    <FlexItem>
                      <Content component={ContentVariants.small}>
                        {formatDateTime(unit.pulp_created) ?? "—"}
                      </Content>
                    </FlexItem>
                    <FlexItem>
                      <MetaDot />
                    </FlexItem>
                    <FlexItem>
                      <Content component={ContentVariants.small}>
                        {artifactCount}{" "}
                        {artifactCount === 1 ? "artifact" : "artifacts"}
                      </Content>
                    </FlexItem>
                  </Flex>
                </FlexItem>
              </Flex>
            </DataListCell>,
            <DataListCell key="labels" isFilled={false} alignRight>
              {labelEntries.length ? (
                <LabelGroup numLabels={3} isCompact>
                  {labelEntries.map(([labelKey, value]) => (
                    <Label
                      key={labelKey}
                      color="grey"
                      isCompact
                      textMaxWidth={LABEL_MAX_WIDTH}
                      tooltipPosition="top"
                      onClick={
                        onLabelClick
                          ? (event) => {
                              // Don't also select the row.
                              event.stopPropagation();
                              onLabelClick(labelSelector([labelKey, value]));
                            }
                          : undefined
                      }
                    >
                      {value == null ? labelKey : `${labelKey}=${value}`}
                    </Label>
                  ))}
                </LabelGroup>
              ) : null}
            </DataListCell>,
          ]}
        />
        {actions?.length ? (
          <DataListAction
            id={`${key}-actions`}
            aria-labelledby={`${labelId} ${key}-actions`}
            aria-label="Actions"
          >
            <PageHeaderActionsMenu actions={actions} />
          </DataListAction>
        ) : null}
      </DataListItemRow>
      <DataListContent
        id={contentId}
        aria-label="Artifacts"
        isHidden={!isExpanded}
      >
        <ArtifactsPanel artifacts={artifacts} />
      </DataListContent>
    </DataListItem>
  );
};

import type React from "react";

import {
  ExpandableSection,
  Flex,
  FlexItem,
  FormSection,
  Grid,
  GridItem,
  Label,
  Stack,
} from "@patternfly/react-core";

import type { ResourceFilterMap } from "@app/utils/resourceFilter";

import { sectionSummary } from "../derive/sectionState";
import { isFieldVisible } from "../derive/visibility";
import { FieldRenderer } from "../fields/FieldRenderer";
import type { IFieldDef, IFormContext, ISectionDef } from "../types";

interface IFormSectionViewProps {
  section: ISectionDef;
  ctx: IFormContext;
  anchorId: string;
  idPrefix: string;
  resourceFilter: ResourceFilterMap;
  isExpanded: boolean;
  onToggle: (isExpanded: boolean) => void;
}

/** One section: essentials always open, others collapsible with a summary when closed. */
export const FormSectionView: React.FC<IFormSectionViewProps> = ({
  section,
  ctx,
  anchorId,
  idPrefix,
  resourceFilter,
  isExpanded,
  onToggle,
}) => {
  const renderField = (field: IFieldDef) =>
    isFieldVisible({ field, ctx }) ? (
      <FieldRenderer
        key={field.key}
        field={field}
        ctx={ctx}
        idPrefix={idPrefix}
        resourceFilter={resourceFilter}
      />
    ) : null;

  const items = section.items.map((item) => {
    if (!("row" in item)) return renderField(item);
    const visible = item.row.filter((field) => isFieldVisible({ field, ctx }));
    if (visible.length === 0) return null;
    const span = Math.max(1, Math.floor(12 / visible.length)) as GridItemSpan;
    return (
      <Grid key={visible.map((field) => field.key).join("+")} hasGutter>
        {visible.map((field) => (
          <GridItem key={field.key} md={span}>
            {renderField(field)}
          </GridItem>
        ))}
      </Grid>
    );
  });

  if (section.variant === "essentials") {
    return (
      <FormSection id={anchorId} title={section.title}>
        {section.description && <p>{section.description}</p>}
        {items}
      </FormSection>
    );
  }

  const summary = isExpanded ? undefined : sectionSummary({ section, ctx });
  return (
    <FormSection id={anchorId}>
      <ExpandableSection
        isExpanded={isExpanded}
        onToggle={(_event, expanded) => onToggle(expanded)}
        toggleContent={
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            spaceItems={{ default: "spaceItemsSm" }}
          >
            <FlexItem>{section.title}</FlexItem>
            {summary && (
              <FlexItem>
                <Label isCompact color="blue">
                  {summary}
                </Label>
              </FlexItem>
            )}
          </Flex>
        }
      >
        <Stack hasGutter>
          {section.description && <p>{section.description}</p>}
          {items}
        </Stack>
      </ExpandableSection>
    </FormSection>
  );
};

type GridItemSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

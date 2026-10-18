import type React from "react";

import {
  Card,
  CardBody,
  ClipboardCopy,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Label,
  LabelGroup,
  Stack,
  StackItem,
  Title,
} from "@patternfly/react-core";
import { css } from "@patternfly/react-styles";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { getPlugin } from "@catalog";
import type { GenericRemoteResponse } from "@app/client";
import { EntityDetailFields } from "@app/components/EntityDetailFields";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { formatDateTime } from "@app/utils/utils";

const DEFAULT_GROUP = "General";

/** Two columns from md up, single column on narrow screens (OpenShift detail layout). */
const COLUMNS = { default: "1Col", md: "2Col" } as const;

interface IRemoteDetailsViewProps {
  remote: GenericRemoteResponse;
  pulpType: string;
}

const PulpLabels: React.FC<{ labels?: Record<string, string | null> }> = ({
  labels,
}) => {
  const entries = Object.entries(labels ?? {});
  if (entries.length === 0) {
    return <>—</>;
  }
  return (
    <LabelGroup numLabels={8} isCompact>
      {entries.map(([key, value]) => (
        <Label key={key} isCompact>
          {value == null ? key : `${key}: ${value}`}
        </Label>
      ))}
    </LabelGroup>
  );
};

/** A read-only value with a copy affordance, or an em dash when absent. */
const CopyableValue: React.FC<{ value?: string }> = ({ value }) =>
  value ? (
    <ClipboardCopy variant="inline-compact" isReadOnly>
      {value}
    </ClipboardCopy>
  ) : (
    <>—</>
  );

interface ISectionProps {
  title: string;
  withDivider: boolean;
  children: React.ReactNode;
}

const Section: React.FC<ISectionProps> = ({ title, withDivider, children }) => (
  <StackItem>
    {withDivider ? <Divider className={spacing.mbMd} /> : null}
    <Title headingLevel="h2" size="lg" className={css(spacing.mbMd)}>
      {title}
    </Title>
    {children}
  </StackItem>
);

/**
 * OpenShift-style details pane for a remote: a single card of sections (one per
 * catalog field group, plus Metadata), each a responsive two-column description list.
 * Field rows, help popovers, and value rendering are handled by `EntityDetailFields`.
 */
export const RemoteDetailsView: React.FC<IRemoteDetailsViewProps> = ({
  remote,
  pulpType,
}) => {
  const fields = getPlugin(pulpType)?.entities.remote?.form.editFields ?? [];
  const data = remote as Record<string, unknown>;

  // Section headings come from the resolved field groups, in first-appearance order.
  // Plugin extras may introduce their own groups (e.g. "Advanced") — never hardcoded.
  const groupNames = [
    ...new Set(fields.map((field) => field.group ?? DEFAULT_GROUP)),
  ];

  return (
    <Card>
      <CardBody>
        <Stack hasGutter>
          {groupNames.map((groupName, index) => (
            <Section key={groupName} title={groupName} withDivider={index > 0}>
              <EntityDetailFields
                fields={fields.filter(
                  (field) => (field.group ?? DEFAULT_GROUP) === groupName,
                )}
                data={data}
                copyableKeys={["url"]}
                columnModifier={COLUMNS}
              />
            </Section>
          ))}

          <Section title="Metadata" withDivider>
            <DescriptionList isHorizontal columnModifier={COLUMNS}>
              <DescriptionListGroup>
                <DescriptionListTerm>Type</DescriptionListTerm>
                <DescriptionListDescription>
                  <PulpTypeLabel pulpType={pulpType} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Created</DescriptionListTerm>
                <DescriptionListDescription>
                  {formatDateTime(remote.pulp_created) ?? "—"}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Last updated</DescriptionListTerm>
                <DescriptionListDescription>
                  {formatDateTime(remote.pulp_last_updated) ?? "—"}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Labels</DescriptionListTerm>
                <DescriptionListDescription>
                  <PulpLabels labels={remote.pulp_labels} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>PRN</DescriptionListTerm>
                <DescriptionListDescription>
                  <CopyableValue value={remote.prn} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>HREF</DescriptionListTerm>
                <DescriptionListDescription>
                  <CopyableValue value={remote.pulp_href} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </Section>
        </Stack>
      </CardBody>
    </Card>
  );
};

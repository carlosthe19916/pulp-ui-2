import type React from "react";

import {
  ClipboardCopy,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import type { DistributionResponse } from "@app/client";
import { ContentUrlLink } from "@app/components/ContentUrlLink";
import { DetailSectionCard } from "@app/components/DetailSectionCard";
import { EditablePulpLabels } from "@app/components/EditablePulpLabels";
import { EntityDetailFields } from "@app/components/EntityDetailFields";
import { NamedResourceHrefLink } from "@app/components/NamedResourceHrefLink";
import { PluginRepositoryClientSetup } from "@app/components/PluginRepositoryClientSetup";
import { getEntityForm, toDetailSections } from "@app/forms";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import { useDistributionLabelsMutation } from "@app/queries/distributions";
import { notifyLabelsResult } from "@app/utils/batchNotify";
import { toFieldRecord } from "@app/utils/formSchema";
import { formatDateTime } from "@app/utils/utils";

const COLUMNS = { default: "1Col", md: "2Col" } as const;

// Shown in the Serving card: what the distribution serves, with links.
const SOURCE_KEYS = ["repository", "repository_version", "publication"];

interface IDistributionDetailsViewProps {
  distribution: DistributionResponse;
  pulpType: string;
}

interface IFactProps {
  term: string;
  children: React.ReactNode;
}

const Fact: React.FC<IFactProps> = ({ term, children }) => (
  <DescriptionListGroup>
    <DescriptionListTerm>{term}</DescriptionListTerm>
    <DescriptionListDescription>{children}</DescriptionListDescription>
  </DescriptionListGroup>
);

/**
 * A distribution's Details tab: where and how it is served, then its settings grouped the way
 * its form groups them (ADR 0009), then metadata.
 */
export const DistributionDetailsView: React.FC<
  IDistributionDetailsViewProps
> = ({ distribution, pulpType }) => {
  const href = distribution.pulp_href ?? "";
  const data = toFieldRecord(distribution);
  const publication =
    typeof data.publication === "string" ? data.publication : null;
  const { disabledProps } = useObjectPermissions({ href });
  const { addNotification } = useNotifications();
  const { mutateAsync, isPending } = useDistributionLabelsMutation({
    onSuccess: (result) => notifyLabelsResult({ addNotification, result }),
  });

  const form = getEntityForm({
    entity: "distribution",
    pulpType,
    mode: "edit",
  })?.form;
  const settings = (form ? toDetailSections(form) : [])
    .map((section) => ({
      ...section,
      fields: section.fields.filter(
        (field) => !SOURCE_KEYS.includes(field.key),
      ),
    }))
    .filter((section) => section.fields.length > 0);

  return (
    <Stack hasGutter>
      <StackItem>
        <DetailSectionCard id="serving" title="Serving">
          <DescriptionList columnModifier={COLUMNS}>
            <Fact term="Base URL">
              <ContentUrlLink distribution={distribution} />
            </Fact>
            <Fact term="Client setup">
              <PluginRepositoryClientSetup distribution={distribution} />
            </Fact>
            <Fact term="Repository">
              <NamedResourceHrefLink
                kind="repository"
                href={distribution.repository}
              />
            </Fact>
            <Fact term="Repository version">
              <NamedResourceHrefLink
                kind="repositoryVersion"
                href={distribution.repository_version}
              />
            </Fact>
            <Fact term="Publication">{publication ?? "—"}</Fact>
          </DescriptionList>
        </DetailSectionCard>
      </StackItem>
      {settings.map((section) => (
        <StackItem key={section.id}>
          <DetailSectionCard id={section.id} title={section.title}>
            <EntityDetailFields
              fields={section.fields}
              data={data}
              copyableKeys={["base_path"]}
              columnModifier={COLUMNS}
            />
          </DetailSectionCard>
        </StackItem>
      ))}
      <StackItem>
        <DetailSectionCard id="metadata" title="Metadata">
          <DescriptionList columnModifier={COLUMNS}>
            <Fact term="Labels">
              <EditablePulpLabels
                labels={distribution.pulp_labels}
                actionProps={disabledProps("change")}
                isSaving={isPending}
                onSave={(changes) => mutateAsync({ href, ...changes })}
              />
            </Fact>
            <Fact term="Created">
              {formatDateTime(distribution.pulp_created) ?? "—"}
            </Fact>
            <Fact term="PRN">
              {distribution.prn ? (
                <ClipboardCopy variant="inline-compact" isReadOnly>
                  {distribution.prn}
                </ClipboardCopy>
              ) : (
                "—"
              )}
            </Fact>
          </DescriptionList>
        </DetailSectionCard>
      </StackItem>
    </Stack>
  );
};

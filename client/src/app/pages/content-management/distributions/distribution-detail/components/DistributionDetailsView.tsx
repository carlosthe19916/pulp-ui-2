import type React from "react";

import {
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
import { EntityMetadataList } from "@app/components/EntityMetadataList";
import { FormDetailSections } from "@app/components/FormDetailSections";
import { NamedResourceHrefLink } from "@app/components/NamedResourceHrefLink";
import { PluginRepositoryClientSetup } from "@app/components/PluginRepositoryClientSetup";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import { toDetailSections } from "@app/plugin-forms";
import { useDistributionLabelsMutation } from "@app/queries/distributions";
import { notifyLabelsResult } from "@app/utils/batchNotify";
import { toFieldRecord } from "@app/utils/formSchema";
import { getEntityForm } from "@plugins";

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
 * its form groups them (ADR 0010), then metadata.
 */
export const DistributionDetailsView: React.FC<
  IDistributionDetailsViewProps
> = ({ distribution, pulpType }) => {
  const href = distribution.pulp_href ?? "";
  const data = toFieldRecord(distribution);
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
  const sections = form ? toDetailSections(form) : [];
  // The Serving card offers only the sources this type's form has.
  const sources = new Set(
    sections
      .flatMap((section) => section.fields)
      .map((field) => field.key)
      .filter((key) => SOURCE_KEYS.includes(key)),
  );
  const settings = sections
    .map((section) => ({
      ...section,
      fields: section.fields.filter(
        (field) => !SOURCE_KEYS.includes(field.key),
      ),
    }))
    .filter((section) => section.fields.length > 0);
  const publication =
    typeof data.publication === "string" ? data.publication : null;

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
            {sources.has("repository") && (
              <Fact term="Repository">
                <NamedResourceHrefLink
                  kind="repository"
                  href={distribution.repository}
                />
              </Fact>
            )}
            {sources.has("repository_version") && (
              <Fact term="Repository version">
                <NamedResourceHrefLink
                  kind="repositoryVersion"
                  href={distribution.repository_version}
                />
              </Fact>
            )}
            {sources.has("publication") && (
              <Fact term="Publication">
                <ResourceHrefLink kind="publication" href={publication} />
              </Fact>
            )}
          </DescriptionList>
        </DetailSectionCard>
      </StackItem>
      <FormDetailSections
        sections={settings}
        data={data}
        copyableKeys={["base_path"]}
      />
      <StackItem>
        <DetailSectionCard id="metadata" title="Metadata">
          <EntityMetadataList
            entity={distribution}
            pulpType={pulpType}
            labels={
              <EditablePulpLabels
                labels={distribution.pulp_labels}
                actionProps={disabledProps("change")}
                isSaving={isPending}
                onSave={(changes) => mutateAsync({ href, ...changes })}
              />
            }
          />
        </DetailSectionCard>
      </StackItem>
    </Stack>
  );
};

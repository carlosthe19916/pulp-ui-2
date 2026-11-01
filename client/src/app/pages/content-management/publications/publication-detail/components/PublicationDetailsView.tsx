import type React from "react";

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  List,
  ListItem,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import type { PublicationResponse } from "@app/client";
import { DetailSectionCard } from "@app/components/DetailSectionCard";
import { EntityMetadataList } from "@app/components/EntityMetadataList";
import { FormDetailSections } from "@app/components/FormDetailSections";
import { NamedResourceHrefLink } from "@app/components/NamedResourceHrefLink";
import { toDetailSections } from "@app/plugin-forms";
import { toFieldRecord } from "@app/utils/formSchema";
import { getEntityForm } from "@plugins";

const COLUMNS = { default: "1Col", md: "2Col" } as const;

// Shown in the Source card, with links.
const SOURCE_KEYS = ["repository", "repository_version"];

interface IPublicationDetailsViewProps {
  publication: PublicationResponse;
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
 * A publication's Details tab: what it was published from and who serves it, then its
 * settings grouped the way its create form groups them, then metadata.
 */
export const PublicationDetailsView: React.FC<IPublicationDetailsViewProps> = ({
  publication,
  pulpType,
}) => {
  const data = toFieldRecord(publication);
  // Only the typed payloads carry `distributions`.
  const distributions = Array.isArray(data.distributions)
    ? data.distributions.filter((href) => typeof href === "string")
    : [];

  // Publications are immutable: the create form is the only one.
  const form = getEntityForm({
    entity: "publication",
    pulpType,
    mode: "create",
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
        <DetailSectionCard id="source" title="Source">
          <DescriptionList columnModifier={COLUMNS}>
            <Fact term="Repository">
              <NamedResourceHrefLink
                kind="repository"
                href={publication.repository}
              />
            </Fact>
            <Fact term="Repository version">
              <NamedResourceHrefLink
                kind="repositoryVersion"
                href={publication.repository_version}
              />
            </Fact>
            <Fact term="Distributions">
              {distributions.length > 0 ? (
                <List isPlain>
                  {distributions.map((href) => (
                    <ListItem key={href}>
                      <NamedResourceHrefLink kind="distribution" href={href} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                "—"
              )}
            </Fact>
          </DescriptionList>
        </DetailSectionCard>
      </StackItem>
      <FormDetailSections sections={settings} data={data} />
      <StackItem>
        <DetailSectionCard id="metadata" title="Metadata">
          <EntityMetadataList entity={publication} pulpType={pulpType} />
        </DetailSectionCard>
      </StackItem>
    </Stack>
  );
};

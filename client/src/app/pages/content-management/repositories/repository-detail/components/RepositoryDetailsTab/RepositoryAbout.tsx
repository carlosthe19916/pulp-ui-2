import type React from "react";

import { Link } from "@tanstack/react-router";

import {
  ClipboardCopy,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  Stack,
  Title,
} from "@patternfly/react-core";

import type {
  RepositoryResponse,
  RepositoryVersionResponse,
} from "@app/client";
import { EditablePulpLabels } from "@app/components/EditablePulpLabels";
import { EntityDetailFields } from "@app/components/EntityDetailFields";
import { NamedResourceHrefLink } from "@app/components/NamedResourceHrefLink";
import { toDetailSections } from "@app/forms";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import { useRepositoryLabelsMutation } from "@app/queries/repositories";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { notifyLabelsResult } from "@app/utils/batchNotify";
import { summaryTotal } from "@app/utils/contentSummary";
import { toFieldRecord } from "@app/utils/formSchema";
import { formatDateTime, isEmptyValue } from "@app/utils/utils";
import { getEntityForm } from "@plugins";

interface IRepositoryAboutProps {
  repository: RepositoryResponse;
  latestVersion?: RepositoryVersionResponse;
  pulpType: string;
  pulpDomain: string;
}

const COLUMNS = { default: "1Col", md: "2Col", xl: "3Col" } as const;

// Shown as the page title, the description paragraph and the Remote fact.
const NON_SETTING_KEYS = ["name", "description", "remote"];

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

/** Key facts about a repository, then its set settings grouped the way its form groups them. */
export const RepositoryAbout: React.FC<IRepositoryAboutProps> = ({
  repository,
  latestVersion,
  pulpType,
  pulpDomain,
}) => {
  const href = repository.pulp_href ?? "";
  const { disabledProps } = useObjectPermissions({ href });
  const { addNotification } = useNotifications();
  const { mutateAsync, isPending } = useRepositoryLabelsMutation({
    onSuccess: (result) => notifyLabelsResult({ addNotification, result }),
  });
  const data = toFieldRecord(repository);
  // Labelled the way the repository's form labels them (ADR 0010).
  const form = getEntityForm({
    entity: "repository",
    pulpType,
    mode: "edit",
  })?.form;
  const settings = (form ? toDetailSections(form) : [])
    .map((section) => ({
      ...section,
      fields: section.fields.filter(
        (f) => !NON_SETTING_KEYS.includes(f.key) && !isEmptyValue(data[f.key]),
      ),
    }))
    .filter((section) => section.fields.length > 0);
  const latestNumber = repository.latest_version_href
    ? extractIdFromHref(repository.latest_version_href)
    : undefined;

  return (
    <Stack hasGutter>
      {repository.description && (
        <Content component="p">{repository.description}</Content>
      )}
      <DescriptionList columnModifier={COLUMNS} isCompact>
        <Fact term="Type">
          <Label color="blue">{pulpType}</Label>
        </Fact>
        <Fact term="Latest version">
          {latestNumber != null ? (
            <Link
              to="/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/versions/$versionNumber"
              params={{
                pulpDomain,
                repositoryType: pulpType,
                repositoryId: extractIdFromHref(repository.pulp_href ?? ""),
                versionNumber: latestNumber,
              }}
            >
              Version {latestNumber}
            </Link>
          ) : (
            "—"
          )}
          {latestVersion?.pulp_created && (
            <Content component="small">
              {formatDateTime(latestVersion.pulp_created)}
            </Content>
          )}
        </Fact>
        <Fact term="Content">
          {summaryTotal(
            latestVersion?.content_summary?.present,
          ).toLocaleString()}{" "}
          units
        </Fact>
        {repository.remote && (
          <Fact term="Remote">
            <NamedResourceHrefLink kind="remote" href={repository.remote} />
          </Fact>
        )}
        <Fact term="Last updated">
          {formatDateTime(repository.pulp_last_updated) ?? "—"}
        </Fact>
        <Fact term="Created">
          {formatDateTime(repository.pulp_created) ?? "—"}
        </Fact>
        <Fact term="Labels">
          <EditablePulpLabels
            labels={repository.pulp_labels}
            actionProps={disabledProps("change")}
            isSaving={isPending}
            onSave={(changes) => mutateAsync({ href, ...changes })}
          />
        </Fact>
        {repository.prn && (
          <Fact term="PRN">
            <ClipboardCopy variant="inline-compact" isReadOnly>
              {repository.prn}
            </ClipboardCopy>
          </Fact>
        )}
      </DescriptionList>
      {settings.map((section) => (
        <Stack key={section.id}>
          <Title headingLevel="h3" size="md">
            {section.title}
          </Title>
          <EntityDetailFields
            fields={section.fields}
            data={data}
            columnModifier={COLUMNS}
          />
        </Stack>
      ))}
    </Stack>
  );
};

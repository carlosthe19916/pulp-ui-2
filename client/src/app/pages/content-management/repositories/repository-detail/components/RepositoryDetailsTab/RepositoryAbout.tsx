import type React from "react";

import { Link } from "@tanstack/react-router";

import {
  ClipboardCopy,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
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
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import { repositoryKeys } from "@app/queries/repositories";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { summaryTotal } from "@app/utils/contentSummary";
import { formatDateTime, isEmptyValue } from "@app/utils/utils";
import { getPlugin } from "@catalog";

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

/** Key facts about a repository, then the plugin settings that hold a value. */
export const RepositoryAbout: React.FC<IRepositoryAboutProps> = ({
  repository,
  latestVersion,
  pulpType,
  pulpDomain,
}) => {
  const { disabledProps } = useObjectPermissions({
    href: repository.pulp_href ?? "",
  });
  const data = repository as Record<string, unknown>;
  const settings = (
    getPlugin(pulpType)?.entities.repository?.form.editFields ?? []
  ).filter(
    (f) => !NON_SETTING_KEYS.includes(f.key) && !isEmptyValue(data[f.key]),
  );
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
          <PulpTypeLabel pulpType={pulpType} />
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
            href={repository.pulp_href ?? ""}
            labels={repository.pulp_labels}
            invalidateKey={repositoryKeys.detail(repository.pulp_href ?? "")}
            actionProps={disabledProps("change")}
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
      {settings.length > 0 && (
        <>
          <Title headingLevel="h3" size="md">
            Settings
          </Title>
          <EntityDetailFields
            fields={settings}
            data={data}
            columnModifier={COLUMNS}
          />
        </>
      )}
    </Stack>
  );
};

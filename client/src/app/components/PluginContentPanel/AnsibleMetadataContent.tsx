import type React from "react";

import type {
  AnsibleAnsibleNamespaceMetadataResponse,
  AnsibleRoleResponse,
} from "@app/client";
import { useContentDetailQuery } from "@app/queries/content";

import type { IPluginContentProps } from "./contentFields";
import { facts, links } from "./contentFields";
import {
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  InstallSnippet,
  LinkList,
  StorageFacts,
} from "./ContentPanelLayout";

/** Galaxy namespace page: the publisher, contact and links. */
export const AnsibleNamespaceContent: React.FC<IPluginContentProps> = ({
  href,
}) => {
  const { data, isLoading, error } =
    useContentDetailQuery<AnsibleAnsibleNamespaceMetadataResponse>({ href });

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={data?.name}
          subtitle={data?.company}
          summary={data?.description}
        />
      }
      aside={
        <>
          <LinkList
            links={links(
              Object.fromEntries(
                (data?.links ?? []).map((link) => [link.name, link.url]),
              ),
            )}
          />
          <FactList title="Contact" items={facts({ Email: data?.email })} />
        </>
      }
    >
      {data?.resources ? (
        <ContentSection title="Resources">{data.resources}</ContentSection>
      ) : null}
    </ContentPanelLayout>
  );
};

/** Galaxy legacy role page: role name, version and install command. */
export const AnsibleRoleContent: React.FC<IPluginContentProps> = ({ href }) => {
  const { data, isLoading, error } = useContentDetailQuery<AnsibleRoleResponse>(
    { href },
  );
  const name = `${data?.namespace}.${data?.name}`;

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={<ContentHeader title={name} version={data?.version} />}
      aside={
        <StorageFacts
          href={href}
          artifactHref={data?.artifact}
          created={data?.pulp_created}
          labels={data?.pulp_labels}
        />
      }
    >
      <InstallSnippet
        command={`ansible-galaxy role install ${name},${data?.version}`}
      />
    </ContentPanelLayout>
  );
};

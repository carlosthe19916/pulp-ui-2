import type React from "react";

import type { AnsibleCollectionVersionResponse } from "@app/client";
import { useContentDetailQuery } from "@app/queries/content";

import {
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  InstallSnippet,
  LabelList,
  LinkList,
  StorageFacts,
} from "./ContentPanelLayout";
import { facts, links } from "./contentFields";
import type { IPluginContentProps } from "./contentFields";

/** Ansible Galaxy style: FQCN, install command, tags; project links in the sidebar. */
export const AnsibleContent: React.FC<IPluginContentProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<AnsibleCollectionVersionResponse>({ href });

  const fqcn = `${data?.namespace}.${data?.name}`;
  const tags = (data?.tags ?? [])
    .map((tag) => tag.name)
    .filter((name): name is string => !!name);

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={<ContentHeader title={fqcn} version={data?.version} />}
      aside={
        <>
          <LinkList
            links={links({
              Repository: data?.origin_repository,
              Documentation: data?.documentation,
              Homepage: data?.homepage,
              Issues: data?.issues,
            })}
          />
          <FactList
            title="Meta"
            items={facts({
              License: data?.license?.join(", "),
              Authors: data?.authors?.join(", "),
              "Requires Ansible": data?.requires_ansible,
            })}
          />
          <StorageFacts
            artifactHref={data?.artifact}
            sha256={data?.sha256}
            created={data?.pulp_created}
            labels={data?.pulp_labels}
          />
        </>
      }
    >
      <InstallSnippet
        command={`ansible-galaxy collection install ${fqcn}:==${data?.version}`}
      />
      <ContentSection title="Tags">
        <LabelList items={tags} emptyText="No tags" />
      </ContentSection>
    </ContentPanelLayout>
  );
};

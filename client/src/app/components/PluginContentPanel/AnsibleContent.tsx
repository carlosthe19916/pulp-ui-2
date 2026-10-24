import type React from "react";

import type { AnsibleCollectionVersionResponse } from "@app/client";
import {
  useContentDetailQuery,
  useContentTypeListQuery,
} from "@app/queries/content";

import type { IPluginContentProps } from "./contentFields";
import { facts, links } from "./contentFields";
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

interface ICollectionContent {
  name: string;
  content_type: string;
}

interface ICollectionContentsProps {
  href: string;
}

/**
 * Modules, plugins and roles in the collection, grouped by type. The REST API omits
 * `contents` unless it's requested with `fields`, so ask for it explicitly.
 */
const CollectionContents: React.FC<ICollectionContentsProps> = ({ href }) => {
  const { data } = useContentTypeListQuery({
    pulpType: "ansible.collection_version",
    params: { pulp_href__in: [href], limit: 1, fields: ["contents"] },
  });
  // `contents` is only returned when requested, so the generated row type omits it.
  const row = data?.results[0] as
    { contents?: ICollectionContent[] } | undefined;
  const contents = row?.contents ?? [];
  const byType = Object.entries(
    contents.reduce<Record<string, string[]>>((groups, content) => {
      (groups[content.content_type] ??= []).push(content.name);
      return groups;
    }, {}),
  );

  return (
    <FactList
      title={`Contents (${contents.length})`}
      items={byType.map(([type, names]) => ({
        term: type,
        value: names.join(", "),
      }))}
    />
  );
};

/** Ansible Galaxy style: FQCN, install command, tags, contents; project links in the sidebar. */
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
            href={href}
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
      <CollectionContents href={href} />
    </ContentPanelLayout>
  );
};

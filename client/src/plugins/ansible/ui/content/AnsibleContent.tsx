import type React from "react";

import type {
  AnsibleCollectionVersionResponse,
  AnsibleCollectionVersionSignatureResponse,
} from "@app/client";
import {
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  facts,
  InstallSnippet,
  LabelList,
  LinkList,
  links,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { lookupScope, Signatures } from "@app/components/Signatures";
import { usePersistentState } from "@app/hooks/usePersistentState";
import {
  useContentDetailQuery,
  useContentTypeListQuery,
} from "@app/queries/content";
import { PAGINATION_STATE } from "@app/utils/listState";
import type { IContentPanelProps } from "@plugin-sdk/ui";

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
  // `contents` is only returned when requested, so the generated type omits it.
  const { data } = useContentDetailQuery<{ contents?: ICollectionContent[] }>({
    href,
    fields: ["contents"],
  });
  const contents = data?.contents ?? [];
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

const toSignature = (signature: AnsibleCollectionVersionSignatureResponse) => ({
  key: signature.pubkey_fingerprint ?? "",
  signingService: signature.signing_service,
  href: signature.pulp_href,
});

/** Ansible Galaxy style: FQCN, install command, tags, contents; project links in the sidebar. */
export const AnsibleContent: React.FC<IContentPanelProps> = ({
  href,
  versionHref,
}) => {
  const { data, isLoading, error } =
    useContentDetailQuery<AnsibleCollectionVersionResponse>({ href });
  const [pagination, setPagination] = usePersistentState({
    ...PAGINATION_STATE,
    storage: "state",
  });
  const signatures = useContentTypeListQuery({
    pulpType: "ansible.collection_signature",
    params: {
      signed_collection: href,
      repository_version: versionHref,
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      fields: ["pulp_href", "pubkey_fingerprint", "signing_service"],
    },
  });

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
      <Signatures
        isLoading={signatures.isLoading}
        emptyText={`No signatures in ${lookupScope(versionHref)}`}
        paging={{
          count: signatures.data?.count ?? 0,
          pagination,
          onPaginationChange: setPagination,
        }}
        signatures={(signatures.data?.results ?? []).map(toSignature)}
      />
    </ContentPanelLayout>
  );
};

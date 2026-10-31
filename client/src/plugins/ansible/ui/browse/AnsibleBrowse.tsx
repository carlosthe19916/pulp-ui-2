import type React from "react";

import {
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  Title,
} from "@patternfly/react-core";

import {
  BrowseDataList,
  BrowseTable,
  type IBrowseContext,
  StatusBadges,
  useBrowseListState,
} from "@app/components/BrowseShell";
import {
  useContentTypeListQueries,
  useContentTypeListQuery,
} from "@app/queries/content";

import { fqcn } from "./helpers";

/** Galaxy-style collection rows: newest version first within each collection. */
export const AnsibleCollections: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState({
    filters: [
      {
        param: "namespace",
        label: "Namespace",
        placeholder: "Exact namespace",
      },
      { param: "name", label: "Name", placeholder: "Exact name" },
      { param: "tags", label: "Tag", placeholder: "Comma-separated tags" },
    ] as const,
  });
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "ansible.collection_version",
    params: {
      ...list.params,
      repository_version: versionHref,
      ordering: ["namespace", "name", "-version"],
      fields: [
        "pulp_href",
        "namespace",
        "name",
        "version",
        "description",
        "tags",
        "requires_ansible",
      ],
    },
  });
  const collections = data?.results ?? [];
  // `signed_collection` takes one href (no `__in`), so probe each row's signature count.
  const signatureProbes = useContentTypeListQueries({
    pulpType: "ansible.collection_signature",
    paramsList: collections.map((collection) => ({
      repository_version: versionHref,
      signed_collection: collection.pulp_href,
      limit: 1,
      fields: ["pulp_href"],
    })),
  });
  const signed = new Set(
    collections
      .filter((_, index) => (signatureProbes[index]?.data?.count ?? 0) > 0)
      .map((collection) => collection.pulp_href),
  );

  return (
    <BrowseDataList
      ariaLabel="Collections"
      list={list}
      rows={collections}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle="No collections"
      rowHref={(collection) => collection.pulp_href ?? ""}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      renderRow={(collection) => (
        <Flex
          direction={{ default: "column" }}
          spaceItems={{ default: "spaceItemsSm" }}
        >
          <Flex
            spaceItems={{ default: "spaceItemsSm" }}
            alignItems={{ default: "alignItemsCenter" }}
          >
            <FlexItem>
              <Title headingLevel="h3" size="md">
                {fqcn(collection)}
              </Title>
            </FlexItem>
            <FlexItem>
              <Label isCompact color="blue">
                {collection.version}
              </Label>
            </FlexItem>
            <FlexItem>
              <StatusBadges
                statuses={[signed.has(collection.pulp_href ?? "") && "signed"]}
              />
            </FlexItem>
          </Flex>
          {collection.description ? (
            <Content component={ContentVariants.p}>
              {collection.description}
            </Content>
          ) : null}
          <Flex
            spaceItems={{ default: "spaceItemsMd" }}
            alignItems={{ default: "alignItemsCenter" }}
          >
            {collection.tags?.length ? (
              <FlexItem>
                <LabelGroup numLabels={8}>
                  {collection.tags.map((tag) => (
                    <Label key={tag.name} isCompact variant="outline">
                      {tag.name}
                    </Label>
                  ))}
                </LabelGroup>
              </FlexItem>
            ) : null}
            {collection.requires_ansible ? (
              <FlexItem>
                <Content component={ContentVariants.small}>
                  Requires Ansible {collection.requires_ansible}
                </Content>
              </FlexItem>
            ) : null}
          </Flex>
        </Flex>
      )}
    />
  );
};

/**
 * Deprecated collections. A deprecation names a collection only by namespace and name,
 * and the endpoint can't filter by either, so it is listed here rather than as a badge.
 */
export const AnsibleDeprecations: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState();
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "ansible.collection_deprecation",
    params: {
      ...list.params,
      repository_version: versionHref,
      fields: ["pulp_href", "namespace", "name"],
    },
  });

  return (
    <BrowseTable
      ariaLabel="Deprecated collections"
      list={list}
      rows={data?.results ?? []}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle="No deprecated collections"
      rowHref={(deprecation) => deprecation.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      columns={[
        { title: "Collection", width: 60, cell: (d) => fqcn(d) },
        { title: "Namespace", width: 40, cell: (d) => d.namespace },
      ]}
    />
  );
};

/** Publishers, as Galaxy lists namespaces. */
export const AnsibleNamespaces: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState({
    sort: {
      keys: ["name", "company"] as const,
      initial: { sortBy: "name", direction: "asc" },
    },
    filters: [{ param: "name__icontains", label: "Name" }] as const,
  });
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "ansible.namespace",
    params: {
      ...list.params,
      repository_version: versionHref,
      fields: ["pulp_href", "name", "company", "email", "description"],
    },
  });

  return (
    <BrowseTable
      ariaLabel="Namespaces"
      list={list}
      rows={data?.results ?? []}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle="No namespaces"
      rowHref={(namespace) => namespace.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      columns={[
        {
          title: "Name",
          width: 20,
          sort: list.sortProps("name"),
          cell: (n) => n.name,
        },
        {
          title: "Company",
          sort: list.sortProps("company"),
          width: 20,
          cell: (n) => n.company || "—",
        },
        { title: "Email", width: 20, cell: (n) => n.email || "—" },
        {
          title: "Description",
          isTruncated: true,
          width: 40,
          cell: (n) => n.description || "—",
        },
      ]}
    />
  );
};

/** Legacy standalone roles. */
export const AnsibleRoles: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState({
    sort: {
      keys: ["namespace", "name", "version"] as const,
      initial: { sortBy: "name", direction: "asc" },
    },
    filters: [
      {
        param: "namespace",
        label: "Namespace",
        placeholder: "Exact namespace",
      },
      { param: "name", label: "Name", placeholder: "Exact name" },
    ] as const,
  });
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "ansible.role",
    params: { ...list.params, repository_version: versionHref },
  });

  return (
    <BrowseTable
      ariaLabel="Roles"
      list={list}
      rows={data?.results ?? []}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle="No roles"
      rowHref={(role) => role.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      columns={[
        {
          title: "Role",
          sort: list.sortProps("name"),
          width: 50,
          cell: (role) => fqcn(role),
        },
        {
          title: "Namespace",
          sort: list.sortProps("namespace"),
          width: 30,
          cell: (role) => role.namespace,
        },
        {
          title: "Version",
          sort: list.sortProps("version"),
          width: 20,
          cell: (role) => role.version,
        },
      ]}
    />
  );
};

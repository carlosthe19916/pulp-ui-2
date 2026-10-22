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
  useContentTypeAllQuery,
  useContentTypeListQuery,
} from "@app/queries/content";

import { fqcn } from "./helpers";
import { BrowseDataList } from "./BrowseDataList";
import { BrowseTable } from "./BrowseTable";
import { StatusBadges } from "./StatusBadges";
import type { IBrowseContext } from "./types";
import { useBrowseListState } from "./useBrowseListState";

/** Galaxy-style collection rows: newest version first within each collection. */
export const AnsibleCollections: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
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
  // Signatures link to a collection version and deprecations to a collection, with no
  // `__in` filter, so fetch the version's (small) sets once and match here.
  const signatures = useContentTypeAllQuery({
    pulpType: "ansible.collection_signature",
    params: { repository_version: versionHref, fields: ["signed_collection"] },
  });
  const deprecations = useContentTypeAllQuery({
    pulpType: "ansible.collection_deprecation",
    params: { repository_version: versionHref, fields: ["namespace", "name"] },
  });
  const signed = new Set(
    signatures.data?.results.map((s) => s.signed_collection),
  );
  const deprecated = new Set(deprecations.data?.results.map(fqcn));

  return (
    <BrowseDataList
      ariaLabel="Collections"
      list={list}
      rows={data?.results ?? []}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle="No collections"
      rowHref={(collection) => collection.pulp_href ?? ""}
      selectedHref={selectedHref}
      onSelect={onSelect}
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
                statuses={[
                  signed.has(collection.pulp_href ?? "") && "signed",
                  deprecated.has(fqcn(collection)) && "deprecated",
                ]}
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

/** Publishers, as Galaxy lists namespaces. */
export const AnsibleNamespaces: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
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
      columns={[
        { title: "Name", sort: list.sortProps("name"), cell: (n) => n.name },
        {
          title: "Company",
          sort: list.sortProps("company"),
          cell: (n) => n.company || "—",
        },
        { title: "Email", cell: (n) => n.email || "—" },
        {
          title: "Description",
          isTruncated: true,
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
      columns={[
        {
          title: "Role",
          sort: list.sortProps("name"),
          cell: (role) => fqcn(role),
        },
        {
          title: "Namespace",
          sort: list.sortProps("namespace"),
          cell: (role) => role.namespace,
        },
        {
          title: "Version",
          sort: list.sortProps("version"),
          cell: (role) => role.version,
        },
      ]}
    />
  );
};

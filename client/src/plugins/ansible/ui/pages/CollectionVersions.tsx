import type React from "react";

import { Label, LabelGroup, PaginationVariant } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { ListPagination } from "@app/components/ListPagination";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { useContentTypeListQuery } from "@app/queries/content";
import { formatDateTime } from "@app/utils/utils";

import { COLLECTION_VERSIONS_STATE } from "./collectionVersionsState";

interface ICollectionVersionsProps {
  namespace: string;
  name: string;
  /** Comma-separated tags a version must have; empty shows every version. */
  tags: string;
}

/** A collection's versions (newest first), optionally only those with some tags. */
export const CollectionVersions: React.FC<ICollectionVersionsProps> = ({
  namespace,
  name,
  tags,
}) => {
  const [pagination, setPagination] = usePersistentState({
    ...COLLECTION_VERSIONS_STATE.pagination,
    storage: "state",
  });
  const { data, isLoading } = useContentTypeListQuery({
    pulpType: "ansible.collection_version",
    params: {
      namespace,
      name,
      tags: tags || undefined,
      ordering: ["-pulp_created"],
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      fields: ["pulp_href", "version", "tags", "pulp_created"],
    },
  });
  const versions = data?.results ?? [];

  if (isLoading) return <>Loading versions…</>;
  if (versions.length === 0) return <>No versions match.</>;
  return (
    <>
      <Table aria-label={`${namespace}.${name} versions`} variant="compact">
        <Thead>
          <Tr>
            <Th>Version</Th>
            <Th>Tags</Th>
            <Th>Created</Th>
          </Tr>
        </Thead>
        <Tbody>
          {versions.map((version) => (
            <Tr key={version.pulp_href}>
              <Td dataLabel="Version">
                <ResourceHrefLink
                  kind="content"
                  href={version.pulp_href}
                  label={version.version}
                />
              </Td>
              <Td dataLabel="Tags">
                {version.tags?.length ? (
                  <LabelGroup numLabels={6} isCompact>
                    {version.tags.map((tag) => (
                      <Label key={tag.name} isCompact>
                        {tag.name}
                      </Label>
                    ))}
                  </LabelGroup>
                ) : (
                  "—"
                )}
              </Td>
              <Td dataLabel="Created">
                {formatDateTime(version.pulp_created) ?? "—"}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <ListPagination
        variant={PaginationVariant.bottom}
        itemCount={data?.count ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
    </>
  );
};

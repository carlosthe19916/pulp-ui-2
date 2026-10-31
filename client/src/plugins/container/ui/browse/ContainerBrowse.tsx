import type React from "react";
import { useState } from "react";

import prettyBytes from "pretty-bytes";

import { Content, ContentVariants } from "@patternfly/react-core";

import type { ContainerManifestResponse } from "@app/client";
import { GatedButton } from "@app/components/GatedButton";
import { RepositoryActionModal } from "@app/components/RepositoryActionModal";
import { Snippet } from "@app/components/Snippet";
import {
  useContentTypeListQueries,
  useContentTypeListQuery,
} from "@app/queries/content";
import { useRepositoryDetailQuery } from "@app/queries/repositories";
import { platformOf } from "@app/utils/pluginContentFormat";
import {
  BrowseTable,
  type IBrowseContext,
  StatusBadges,
  useBrowseListState,
} from "@plugin-sdk/ui/blocks/browse";

import { isMultiArch, pullCommand } from "./helpers";

const MANIFEST_FIELDS = [
  "pulp_href",
  "digest",
  "media_type",
  "listed_manifests",
  "os",
  "architecture",
  "compressed_image_size",
];

interface IUseSignedManifestsOptions {
  versionHref: string;
  /** The manifests on screen; only these are probed. */
  manifests: Pick<ContainerManifestResponse, "pulp_href" | "digest">[];
}

/**
 * Hrefs of the given manifests that have a signature in the version: one `limit: 1`
 * count probe per manifest on the signature list's `manifest` (digest) filter.
 */
const useSignedManifests = ({
  versionHref,
  manifests,
}: IUseSignedManifestsOptions) => {
  const probes = useContentTypeListQueries({
    pulpType: "container.signature",
    paramsList: manifests.map((manifest) => ({
      repository_version: versionHref,
      manifest: [manifest.digest],
      limit: 1,
      fields: ["pulp_href"],
    })),
  });
  return new Set(
    manifests
      .filter((_, index) => (probes[index]?.data?.count ?? 0) > 0)
      .map((manifest) => manifest.pulp_href),
  );
};

/** Quay / Docker Hub "Tags": each tag with its image's digest, platforms, size and signature. */
export const ContainerTags: React.FC<IBrowseContext> = ({
  versionHref,
  repositoryHref,
  served,
  selectedHref,
  onSelect,
  writes,
  actions,
}) => {
  // Untag is offered where content can be changed (the latest version).
  const untag = writes
    ? actions.find((action) => action.key === "untag")
    : undefined;
  const [untagName, setUntagName] = useState<string | null>(null);
  const { data: repository } = useRepositoryDetailQuery({
    href: untag ? repositoryHref : null,
  });
  const list = useBrowseListState({
    sort: {
      keys: ["name"] as const,
      initial: { sortBy: "name", direction: "asc" },
    },
    filters: [
      { param: "name", label: "Tag", placeholder: "Exact tag" },
    ] as const,
  });
  const tags = useContentTypeListQuery({
    pulpType: "container.tag",
    params: {
      ...list.params,
      repository_version: versionHref,
      fields: ["pulp_href", "name", "tagged_manifest"],
    },
  });
  const tagged = (tags.data?.results ?? []).map((tag) => tag.tagged_manifest);
  const manifests = useContentTypeListQuery({
    pulpType: "container.manifest",
    params: {
      pulp_href__in: tagged,
      limit: tagged.length,
      fields: MANIFEST_FIELDS,
    },
    options: { enabled: tagged.length > 0 },
  });
  const listed = (manifests.data?.results ?? []).flatMap(
    (m) => m.listed_manifests,
  );
  const platforms = useContentTypeListQuery({
    pulpType: "container.manifest",
    params: {
      pulp_href__in: listed,
      limit: listed.length,
      fields: MANIFEST_FIELDS,
    },
    options: { enabled: listed.length > 0 },
  });
  const signed = useSignedManifests({
    versionHref,
    manifests: manifests.data?.results ?? [],
  });

  const byHref = new Map(
    [
      ...(manifests.data?.results ?? []),
      ...(platforms.data?.results ?? []),
    ].map((manifest) => [manifest.pulp_href ?? "", manifest]),
  );
  const platformsOf = (manifest?: ContainerManifestResponse) =>
    isMultiArch(manifest)
      ? (manifest?.listed_manifests ?? [])
          .map((href) => byHref.get(href))
          .map((child) => (child ? platformOf(child) : ""))
          .filter(Boolean)
      : [manifest ? platformOf(manifest) : ""].filter(Boolean);

  const { registryPath } = served;

  return (
    <>
      <BrowseTable
        ariaLabel="Tags"
        list={list}
        rows={tags.data?.results ?? []}
        count={tags.data?.count ?? 0}
        isLoading={tags.isLoading}
        error={tags.error}
        emptyTitle="No tags"
        header={
          registryPath ? (
            <Snippet code={pullCommand({ registryPath, tag: "<tag>" })} />
          ) : undefined
        }
        rowHref={(tag) => tag.pulp_href}
        selectedHref={selectedHref}
        onSelect={onSelect}
        writes={writes}
        columns={[
          {
            title: "Tag",
            sort: list.sortProps("name"),
            width: 25,
            cell: (tag) => tag.name,
          },
          {
            title: "Digest",
            isTruncated: true,
            width: 30,
            cell: (tag) => byHref.get(tag.tagged_manifest)?.digest ?? "—",
          },
          {
            title: "Platforms",
            width: 20,
            cell: (tag) => {
              const manifest = byHref.get(tag.tagged_manifest);
              return platformsOf(manifest).join(", ") || "—";
            },
          },
          {
            title: "Size",
            width: 10,
            cell: (tag) => {
              const size = byHref.get(
                tag.tagged_manifest,
              )?.compressed_image_size;
              return size ? prettyBytes(size) : "—";
            },
          },
          {
            title: "Status",
            width: 15,
            cell: (tag) => (
              <StatusBadges
                statuses={[
                  isMultiArch(byHref.get(tag.tagged_manifest)) && "multiArch",
                  signed.has(tag.tagged_manifest) && "signed",
                ]}
              />
            ),
          },
          ...(untag
            ? [
                {
                  title: "",
                  screenReaderText: "Untag",
                  cell: (tag: { name: string }) => (
                    <GatedButton
                      variant="link"
                      isInline
                      onClick={(event: React.MouseEvent) => {
                        event.stopPropagation();
                        setUntagName(tag.name);
                      }}
                      {...writes?.actionProps}
                    >
                      Untag
                    </GatedButton>
                  ),
                },
              ]
            : []),
        ]}
      />
      {untag && repository && untagName && (
        <RepositoryActionModal
          action={untag}
          repository={repository}
          targetHref={repositoryHref}
          initialValues={{ tag: untagName }}
          onClose={() => setUntagName(null)}
        />
      )}
    </>
  );
};

/** Harbor-style "Artifacts": every manifest, tagged or not. */
export const ContainerManifests: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState({
    sort: {
      keys: ["digest", "media_type", "architecture"] as const,
      initial: { sortBy: "digest", direction: "asc" },
    },
    filters: [
      { param: "digest", label: "Digest", placeholder: "Exact digest" },
    ] as const,
  });
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "container.manifest",
    params: {
      ...list.params,
      repository_version: versionHref,
      fields: [...MANIFEST_FIELDS, "is_bootable", "is_flatpak"],
    },
  });
  const signed = useSignedManifests({
    versionHref,
    manifests: data?.results ?? [],
  });

  return (
    <BrowseTable
      ariaLabel="Manifests"
      list={list}
      rows={data?.results ?? []}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle="No manifests"
      rowHref={(manifest) => manifest.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      columns={[
        {
          title: "Digest",
          sort: list.sortProps("digest"),
          isTruncated: true,
          width: 30,
          cell: (manifest) => manifest.digest,
        },
        {
          title: "Media type",
          sort: list.sortProps("media_type"),
          isTruncated: true,
          width: 25,
          cell: (manifest) => (
            <Content component={ContentVariants.small}>
              {manifest.media_type}
            </Content>
          ),
        },
        {
          title: "Platform",
          sort: list.sortProps("architecture"),
          width: 20,
          cell: (manifest) =>
            isMultiArch(manifest)
              ? `${manifest.listed_manifests.length} platforms`
              : platformOf(manifest) || "—",
        },
        {
          title: "Size",
          width: 10,
          cell: (manifest) =>
            manifest.compressed_image_size
              ? prettyBytes(manifest.compressed_image_size)
              : "—",
        },
        {
          title: "Status",
          width: 15,
          cell: (manifest) => (
            <StatusBadges
              statuses={[
                isMultiArch(manifest) && "multiArch",
                signed.has(manifest.pulp_href ?? "") && "signed",
              ]}
            />
          ),
        },
      ]}
    />
  );
};

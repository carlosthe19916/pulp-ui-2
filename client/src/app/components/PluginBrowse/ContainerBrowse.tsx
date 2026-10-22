import type React from "react";

import prettyBytes from "pretty-bytes";

import { Content, ContentVariants } from "@patternfly/react-core";

import { Snippet } from "@app/components/Snippet";
import type { ContainerManifestResponse } from "@app/client";
import {
  useContentTypeAllQuery,
  useContentTypeListQuery,
} from "@app/queries/content";

import { isMultiArch, platformOf, pullCommand } from "./helpers";
import { BrowseTable } from "./BrowseTable";
import { StatusBadges } from "./StatusBadges";
import type { IBrowseContext } from "./types";
import { useBrowseListState } from "./useBrowseListState";

const MANIFEST_FIELDS = [
  "pulp_href",
  "digest",
  "media_type",
  "listed_manifests",
  "os",
  "architecture",
  "compressed_image_size",
];

/** The version's signed manifests, matched by href (signatures have no `__in` link filter). */
const useSignedManifests = (versionHref: string) => {
  const { data } = useContentTypeAllQuery({
    pulpType: "container.signature",
    params: { repository_version: versionHref, fields: ["signed_manifest"] },
  });
  return new Set(data?.results.map((s) => s.signed_manifest));
};

/** Quay / Docker Hub "Tags": each tag with its image's digest, platforms, size and signature. */
export const ContainerTags: React.FC<IBrowseContext> = ({
  versionHref,
  served,
  selectedHref,
  onSelect,
}) => {
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
  const signed = useSignedManifests(versionHref);

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
      columns={[
        { title: "Tag", sort: list.sortProps("name"), cell: (tag) => tag.name },
        {
          title: "Digest",
          isTruncated: true,
          cell: (tag) => byHref.get(tag.tagged_manifest)?.digest ?? "—",
        },
        {
          title: "Platforms",
          cell: (tag) => {
            const manifest = byHref.get(tag.tagged_manifest);
            return platformsOf(manifest).join(", ") || "—";
          },
        },
        {
          title: "Size",
          cell: (tag) => {
            const size = byHref.get(tag.tagged_manifest)?.compressed_image_size;
            return size ? prettyBytes(size) : "—";
          },
        },
        {
          title: "Status",
          cell: (tag) => (
            <StatusBadges
              statuses={[
                isMultiArch(byHref.get(tag.tagged_manifest)) && "multiArch",
                signed.has(tag.tagged_manifest) && "signed",
              ]}
            />
          ),
        },
      ]}
    />
  );
};

/** Harbor-style "Artifacts": every manifest, tagged or not. */
export const ContainerManifests: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
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
  const signed = useSignedManifests(versionHref);

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
          cell: (manifest) => (
            <Content component={ContentVariants.small}>
              {manifest.media_type}
            </Content>
          ),
        },
        {
          title: "Platform",
          sort: list.sortProps("architecture"),
          cell: (manifest) =>
            isMultiArch(manifest)
              ? `${manifest.listed_manifests.length} platforms`
              : platformOf(manifest) || "—",
        },
        {
          title: "Size",
          cell: (manifest) =>
            manifest.compressed_image_size
              ? prettyBytes(manifest.compressed_image_size)
              : "—",
        },
        {
          title: "Status",
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

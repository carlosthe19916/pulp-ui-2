import type React from "react";

import prettyBytes from "pretty-bytes";

import type {
  ContainerManifestResponse,
  ContainerTagResponse,
} from "@app/client";
import {
  useContentDetailQuery,
  useContentTypeListQuery,
} from "@app/queries/content";
import { platformOf } from "@app/utils/pluginContentFormat";

import {
  Checksum,
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  LabelList,
  StorageFacts,
} from "./ContentPanelLayout";
import { asStringRecord, facts } from "./contentFields";
import type { IPluginContentProps } from "./contentFields";

/** Image facts, platforms of a multi-arch index, and image labels. */
const ManifestDetails: React.FC<{ manifest?: ContainerManifestResponse }> = ({
  manifest,
}) => {
  const listed = manifest?.listed_manifests ?? [];
  const children = useContentTypeListQuery({
    pulpType: "container.manifest",
    params: {
      pulp_href__in: listed,
      limit: listed.length,
      fields: ["pulp_href", "digest", "os", "architecture"],
    },
    options: { enabled: listed.length > 0 },
  });
  // Image labels are in the API response but not in the generated type.
  const labels = asStringRecord(
    (manifest as { labels?: unknown } | undefined)?.labels,
  );

  return (
    <>
      <FactList
        title="Image"
        items={facts({
          Digest: manifest?.digest ? (
            <Checksum value={manifest.digest} />
          ) : null,
          "Media type": manifest?.media_type,
          Platform: manifest ? platformOf(manifest) : null,
          Size: manifest?.compressed_image_size
            ? prettyBytes(manifest.compressed_image_size)
            : null,
          Layers: manifest?.blobs.length,
          Bootable: manifest?.is_bootable ? "Yes" : null,
          Flatpak: manifest?.is_flatpak ? "Yes" : null,
        })}
      />
      {listed.length ? (
        <ContentSection title="Platforms">
          <LabelList
            items={(children.data?.results ?? []).map(
              (child) => `${platformOf(child)} · ${child.digest.slice(7, 19)}`,
            )}
            emptyText="Loading platforms…"
          />
        </ContentSection>
      ) : null}
      <FactList
        title="Labels"
        items={Object.entries(labels).map(([term, value]) => ({ term, value }))}
      />
    </>
  );
};

/** Quay-style tag page: the tag and the image it points at. */
export const ContainerTagContent: React.FC<IPluginContentProps> = ({
  href,
}) => {
  const tag = useContentDetailQuery<ContainerTagResponse>({ href });
  const manifest = useContentDetailQuery<ContainerManifestResponse>({
    href: tag.data?.tagged_manifest ?? null,
  });

  return (
    <ContentPanelLayout
      isLoading={tag.isLoading}
      error={tag.error}
      header={<ContentHeader title={tag.data?.name} subtitle="Tag" />}
      aside={
        <StorageFacts
          href={href}
          created={tag.data?.pulp_created}
          labels={tag.data?.pulp_labels}
        />
      }
    >
      <ManifestDetails manifest={manifest.data} />
    </ContentPanelLayout>
  );
};

/** Harbor-style artifact page for one manifest. */
export const ContainerManifestContent: React.FC<IPluginContentProps> = ({
  href,
}) => {
  const { data, isLoading, error } =
    useContentDetailQuery<ContainerManifestResponse>({ href });

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={data?.digest.slice(0, 19)}
          subtitle={data?.media_type}
        />
      }
      aside={
        <StorageFacts
          href={href}
          created={data?.pulp_created}
          labels={data?.pulp_labels}
        />
      }
    >
      <ManifestDetails manifest={data} />
    </ContentPanelLayout>
  );
};

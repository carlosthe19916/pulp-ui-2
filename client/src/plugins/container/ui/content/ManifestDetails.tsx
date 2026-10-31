import type React from "react";

import prettyBytes from "pretty-bytes";

import type { ContainerManifestResponse } from "@app/client";
import {
  asStringRecord,
  Checksum,
  ContentSection,
  FactList,
  facts,
  LabelList,
} from "@app/components/ContentPanelLayout";
import { useContentTypeListQuery } from "@app/queries/content";
import { platformOf } from "@app/utils/pluginContentFormat";

interface IManifestDetailsProps {
  manifest?: ContainerManifestResponse;
}

/** Image facts, platforms of a multi-arch index, and image labels. */
export const ManifestDetails: React.FC<IManifestDetailsProps> = ({
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

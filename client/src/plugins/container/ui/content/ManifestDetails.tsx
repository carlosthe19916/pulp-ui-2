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
import { lookupScope, Signatures } from "@app/components/Signatures";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { useContentTypeListQuery } from "@app/queries/content";
import { PAGINATION_STATE } from "@app/utils/listState";
import { platformOf } from "@app/utils/pluginContentFormat";

import { signatureOf } from "./signature";

interface IManifestDetailsProps {
  manifest?: ContainerManifestResponse;
  /** Scopes the signatures to the version shown, when there is one. */
  versionHref?: string;
}

/** Image facts, platforms of a multi-arch index, image labels and signatures. */
export const ManifestDetails: React.FC<IManifestDetailsProps> = ({
  manifest,
  versionHref,
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
  const [pagination, setPagination] = usePersistentState({
    ...PAGINATION_STATE,
    storage: "state",
  });
  const signatures = useContentTypeListQuery({
    pulpType: "container.signature",
    params: {
      manifest: [manifest?.digest ?? ""],
      repository_version: versionHref,
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      fields: [
        "pulp_href",
        "key_id",
        "fingerprint",
        "type",
        "creator",
        "timestamp",
      ],
    },
    options: { enabled: !!manifest },
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
      <Signatures
        isLoading={signatures.isLoading}
        emptyText={`No signatures in ${lookupScope(versionHref)}`}
        paging={{
          count: signatures.data?.count ?? 0,
          pagination,
          onPaginationChange: setPagination,
        }}
        signatures={(signatures.data?.results ?? []).map((signature) => ({
          ...signatureOf(signature),
          href: signature.pulp_href,
        }))}
      />
    </>
  );
};

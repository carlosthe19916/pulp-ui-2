import type React from "react";

import type { ContainerManifestSignatureResponse } from "@app/client";
import {
  ContentHeader,
  ContentPanelLayout,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { Signatures, SignedContent } from "@app/components/Signatures";
import { useContentDetailQuery } from "@app/queries/content";
import type { IContentPanelProps } from "@plugin-sdk/ui";

import { signatureOf } from "./signature";

/** One image signature: its key and the manifest it signs. */
export const ContainerSignatureContent: React.FC<IContentPanelProps> = ({
  href,
}) => {
  const { data, isLoading, error } =
    useContentDetailQuery<ContainerManifestSignatureResponse>({ href });

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={<ContentHeader title={data?.name} subtitle="Image signature" />}
      aside={
        <StorageFacts
          href={href}
          created={data?.pulp_created}
          labels={data?.pulp_labels}
        />
      }
    >
      <SignedContent title="Signs" href={data?.signed_manifest} />
      {data && <Signatures signatures={[signatureOf(data)]} />}
    </ContentPanelLayout>
  );
};

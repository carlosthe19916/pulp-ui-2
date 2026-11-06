import type React from "react";

import type { PythonPackageProvenanceResponse } from "@app/client";
import {
  ContentHeader,
  ContentPanelLayout,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { SignedContent } from "@app/components/Signatures";
import { useContentDetailQuery } from "@app/queries/content";
import type { IContentPanelProps } from "@plugin-sdk/ui";

import { PythonProvenance } from "./PythonProvenance";

/** One PEP 740 provenance: the package it is for, its publisher and log entries. */
export const PythonProvenanceContent: React.FC<IContentPanelProps> = ({
  href,
}) => {
  const { data, isLoading, error } =
    useContentDetailQuery<PythonPackageProvenanceResponse>({ href });

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={<ContentHeader title="Package provenance" />}
      aside={
        <StorageFacts
          href={href}
          sha256={data?.sha256}
          created={data?.pulp_created}
          labels={data?.pulp_labels}
        />
      }
    >
      <SignedContent title="For" href={data?.package} />
      <PythonProvenance provenances={data ? [data] : []} linkUnit={false} />
    </ContentPanelLayout>
  );
};

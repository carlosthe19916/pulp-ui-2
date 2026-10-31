import type React from "react";

import type { NpmPackageResponse } from "@app/client";
import {
  ContentHeader,
  ContentPanelLayout,
  type IContentPanelProps,
  InstallSnippet,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { useContentDetailQuery } from "@app/queries/content";

/** npmjs.com style: package name, version and the install command. */
export const NpmContent: React.FC<IContentPanelProps> = ({ href }) => {
  const { data, isLoading, error } = useContentDetailQuery<NpmPackageResponse>({
    href,
  });

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={<ContentHeader title={data?.name} version={data?.version} />}
      aside={
        <StorageFacts
          href={href}
          artifactHref={data?.artifact}
          created={data?.pulp_created}
          labels={data?.pulp_labels}
        />
      }
    >
      <InstallSnippet command={`npm install ${data?.name}@${data?.version}`} />
    </ContentPanelLayout>
  );
};

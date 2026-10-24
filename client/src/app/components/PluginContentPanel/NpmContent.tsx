import type React from "react";

import type { NpmPackageResponse } from "@app/client";
import { useContentDetailQuery } from "@app/queries/content";

import type { IPluginContentProps } from "./contentFields";
import {
  ContentHeader,
  ContentPanelLayout,
  InstallSnippet,
  StorageFacts,
} from "./ContentPanelLayout";

/** npmjs.com style: package name, version and the install command. */
export const NpmContent: React.FC<IPluginContentProps> = ({ href }) => {
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

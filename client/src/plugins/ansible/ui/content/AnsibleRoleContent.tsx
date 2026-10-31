import type React from "react";

import type { AnsibleRoleResponse } from "@app/client";
import {
  ContentHeader,
  ContentPanelLayout,
  InstallSnippet,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { useContentDetailQuery } from "@app/queries/content";
import type { IContentPanelProps } from "@plugin-sdk/ui";

/** Galaxy legacy role page: role name, version and install command. */
export const AnsibleRoleContent: React.FC<IContentPanelProps> = ({ href }) => {
  const { data, isLoading, error } = useContentDetailQuery<AnsibleRoleResponse>(
    { href },
  );
  const name = `${data?.namespace}.${data?.name}`;

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={<ContentHeader title={name} version={data?.version} />}
      aside={
        <StorageFacts
          href={href}
          artifactHref={data?.artifact}
          created={data?.pulp_created}
          labels={data?.pulp_labels}
        />
      }
    >
      <InstallSnippet
        command={`ansible-galaxy role install ${name},${data?.version}`}
      />
    </ContentPanelLayout>
  );
};

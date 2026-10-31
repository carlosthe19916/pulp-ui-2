import type React from "react";

import type {
  RepositoryResponse,
  RepositoryVersionResponse,
} from "@app/client";
import { RepositoryContent } from "@app/components/RepositoryContent";
import { TableEmptyState } from "@app/components/TableEmptyState";
import type { IContentWrites } from "@app/hooks/useContentUnitSelection";
import { summaryTotal } from "@app/utils/contentSummary";

interface IRepositoryContentTabProps {
  repository: RepositoryResponse;
  pulpType: string;
  latestVersion?: RepositoryVersionResponse;
  /** Content changes on the latest version; absent when the plugin can't change content. */
  writes?: IContentWrites;
}

/** The latest version's content: the plugin's Browse view and the All content list. */
export const RepositoryContentTab: React.FC<IRepositoryContentTabProps> = ({
  repository,
  pulpType,
  latestVersion,
  writes,
}) => {
  if (!latestVersion?.pulp_href) return null;

  if (summaryTotal(latestVersion.content_summary?.present) === 0) {
    return <TableEmptyState title={`No content in "${repository.name}" yet`} />;
  }

  return (
    <RepositoryContent
      // A new latest version remounts the lists, clearing their selection.
      key={latestVersion.pulp_href}
      repositoryHref={repository.pulp_href ?? ""}
      repositoryType={pulpType}
      versionHref={latestVersion.pulp_href}
      summary={latestVersion.content_summary}
      writes={writes}
    />
  );
};

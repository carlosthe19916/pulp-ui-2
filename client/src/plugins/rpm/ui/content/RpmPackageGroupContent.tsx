import type React from "react";

import type { RpmPackageGroupResponse } from "@app/client";
import {
  asArray,
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  facts,
  LabelList,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { useContentDetailQuery } from "@app/queries/content";
import type { IContentPanelProps } from "@plugin-sdk/ui";

/** `dnf group info`: the group and the packages it pulls in. */
export const RpmPackageGroupContent: React.FC<IContentPanelProps> = ({
  href,
}) => {
  const { data, isLoading, error } =
    useContentDetailQuery<RpmPackageGroupResponse>({ href });
  const packages = asArray<{ name?: string } | string>(data?.packages).map(
    (pkg) => (typeof pkg === "string" ? pkg : (pkg.name ?? "")),
  );

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={data?.name}
          subtitle={data?.id}
          summary={data?.description}
        />
      }
      aside={
        <>
          <FactList
            title="Group"
            items={facts({
              Default: data?.default ? "Yes" : "No",
              Visible: data?.user_visible ? "Yes" : "No",
            })}
          />
          <StorageFacts
            href={href}
            created={data?.pulp_created}
            labels={data?.pulp_labels}
          />
        </>
      }
    >
      <ContentSection title={`Packages (${packages.length})`}>
        <LabelList items={packages.filter(Boolean)} emptyText="No packages" />
      </ContentSection>
    </ContentPanelLayout>
  );
};

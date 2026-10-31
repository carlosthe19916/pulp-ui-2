import type React from "react";

import type { RpmModulemdResponse } from "@app/client";
import {
  asArray,
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  facts,
  type IContentPanelProps,
  LabelList,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { useContentDetailQuery } from "@app/queries/content";

/** `dnf module info`: stream, profiles (default marked by the repository), packages. */
export const RpmModulemdContent: React.FC<IContentPanelProps> = ({ href }) => {
  const { data, isLoading, error } = useContentDetailQuery<RpmModulemdResponse>(
    { href },
  );
  const profiles = Object.entries(
    (data?.profiles ?? {}) as Record<string, unknown>,
  ).map(([name, items]) => ({ name, items: asArray<string>(items) }));

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={data ? `${data.name}:${data.stream}` : undefined}
          version={data?.version}
          summary={data?.description}
        />
      }
      aside={
        <>
          <FactList
            title="Module"
            items={facts({ Context: data?.context, Arch: data?.arch })}
          />
          <StorageFacts
            href={href}
            created={data?.pulp_created}
            labels={data?.pulp_labels}
          />
        </>
      }
    >
      <FactList
        title="Profiles"
        items={profiles.map(({ name, items }) => ({
          term: name,
          value: items.join(", ") || "—",
        }))}
      />
      <ContentSection title={`Packages (${data?.packages?.length ?? 0})`}>
        <LabelList
          items={(data?.packages ?? []).filter((p): p is string => !!p)}
          emptyText="No packages"
        />
      </ContentSection>
    </ContentPanelLayout>
  );
};

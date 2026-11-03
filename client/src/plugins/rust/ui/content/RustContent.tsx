import type React from "react";

import type { RustRustContentResponse } from "@app/client";
import {
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  facts,
  InstallSnippet,
  LabelList,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { useContentDetailQuery } from "@app/queries/content";
import type { IContentPanelProps } from "@plugin-sdk/ui";

import { cargoDependencyLabel } from "../helpers";

/** crates.io style: crate and version, its dependencies and features, and `cargo add`. */
export const RustContent: React.FC<IContentPanelProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<RustRustContentResponse>({ href });

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={<ContentHeader title={data?.name} version={data?.vers} />}
      aside={
        <>
          <FactList
            title="Crate"
            items={facts({
              "Rust version": data?.rust_version,
              Links: data?.links,
            })}
          />
          <StorageFacts
            href={href}
            artifactHref={data?.artifact}
            created={data?.pulp_created}
            labels={data?.pulp_labels}
          />
        </>
      }
    >
      <InstallSnippet
        command={`cargo add ${data?.name}@${data?.vers} --registry <registry>`}
      />
      <ContentSection title="Dependencies">
        <LabelList
          items={[
            ...new Set((data?.dependencies ?? []).map(cargoDependencyLabel)),
          ]}
          emptyText="No dependencies"
        />
      </ContentSection>
      <ContentSection title="Features">
        <LabelList
          // Index v2 keeps `dep:` and `?` features in features2.
          items={[
            ...new Set([
              ...Object.keys(data?.features ?? {}),
              ...Object.keys(data?.features2 ?? {}),
            ]),
          ]}
          emptyText="No features"
        />
      </ContentSection>
    </ContentPanelLayout>
  );
};

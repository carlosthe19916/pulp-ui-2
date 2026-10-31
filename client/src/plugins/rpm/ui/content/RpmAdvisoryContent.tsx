import type React from "react";

import { Content, ContentVariants } from "@patternfly/react-core";

import type { RpmUpdateRecordResponse } from "@app/client";
import {
  asArray,
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  facts,
  LabelList,
  LinkList,
  links,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { useContentDetailQuery } from "@app/queries/content";
import { type INevraParams, nevra } from "@app/utils/pluginContentFormat";
import { formatDateTime } from "@app/utils/utils";
import type { IContentPanelProps } from "@plugin-sdk/ui";

interface IAdvisoryReference {
  id?: string;
  title?: string;
  href?: string;
}

/** Satellite erratum page: type, severity, description, references, affected packages. */
export const RpmAdvisoryContent: React.FC<IContentPanelProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<RpmUpdateRecordResponse>({ href });
  const packages = (data?.pkglist ?? []).flatMap((collection) =>
    asArray<INevraParams>(collection.packages),
  );
  const references = asArray<IAdvisoryReference>(data?.references);

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={data?.id}
          subtitle={data?.type}
          summary={data?.title}
        />
      }
      aside={
        <>
          <FactList
            title="Advisory"
            items={facts({
              Severity: data?.severity,
              Status: data?.status,
              Issued: formatDateTime(data?.issued_date),
              Updated: formatDateTime(data?.updated_date),
              "Reboot suggested": data?.reboot_suggested ? "Yes" : null,
              From: data?.fromstr,
            })}
          />
          <LinkList
            links={links(
              Object.fromEntries(
                references.map((ref) => [
                  ref.title || ref.id || ref.href,
                  ref.href,
                ]),
              ),
            )}
          />
          <StorageFacts
            href={href}
            created={data?.pulp_created}
            labels={data?.pulp_labels}
          />
        </>
      }
    >
      {data?.description ? (
        <ContentSection title="Description">
          <Content component={ContentVariants.p}>{data.description}</Content>
        </ContentSection>
      ) : null}
      <ContentSection title={`Packages (${packages.length})`}>
        <LabelList items={packages.map(nevra)} emptyText="No packages" />
      </ContentSection>
    </ContentPanelLayout>
  );
};

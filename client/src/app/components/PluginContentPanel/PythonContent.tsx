import type React from "react";

import { Label } from "@patternfly/react-core";

import type { PythonPythonPackageContentResponse } from "@app/client";
import { useContentDetailQuery } from "@app/queries/content";

import {
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  InstallSnippet,
  LabelList,
  LinkList,
  StorageFacts,
} from "./ContentPanelLayout";
import { asStringRecord, asStrings, facts, links } from "./contentFields";
import type { IPluginContentProps } from "./contentFields";

const PACKAGE_TYPES: Record<string, string> = {
  sdist: "Source",
  bdist_wheel: "Wheel",
  bdist_egg: "Egg",
};

/** The `License` field sometimes holds a whole license text; only show short ones. */
const shortLicense = (license?: string) =>
  license && license.length <= 80 && !license.includes("\n")
    ? license
    : undefined;

/** PyPI style: pip install and requirements; project links in the sidebar. */
export const PythonContent: React.FC<IPluginContentProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<PythonPythonPackageContentResponse>({ href });

  const requirements = asStrings(data?.requires_dist);
  const packageType = data?.packagetype;

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={data?.name}
          version={data?.version}
          summary={data?.summary}
          labels={
            packageType && (
              <Label variant="outline">
                {PACKAGE_TYPES[packageType] ?? packageType}
              </Label>
            )
          }
        />
      }
      aside={
        <>
          <LinkList
            links={links({
              Homepage: data?.home_page,
              ...asStringRecord(data?.project_urls),
              Download: data?.download_url,
            })}
          />
          <FactList
            title="Meta"
            items={facts({
              License: data?.license_expression || shortLicense(data?.license),
              Author: data?.author || data?.author_email,
              Maintainer: data?.maintainer || data?.maintainer_email,
              "Requires Python": data?.requires_python,
            })}
          />
          <StorageFacts
            artifactHref={data?.artifact}
            sha256={data?.sha256}
            size={data?.size}
            created={data?.pulp_created}
            labels={data?.pulp_labels}
          />
        </>
      }
    >
      <InstallSnippet command={`pip install ${data?.name}==${data?.version}`} />
      <ContentSection title="Requirements">
        <LabelList items={requirements} emptyText="No requirements" />
      </ContentSection>
    </ContentPanelLayout>
  );
};

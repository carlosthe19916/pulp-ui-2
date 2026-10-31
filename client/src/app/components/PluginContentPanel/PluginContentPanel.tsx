import type React from "react";
import { createElement, Suspense } from "react";

import { Spinner } from "@patternfly/react-core";

import { BaseContent } from "@app/components/ContentPanelLayout";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import type { IContentPanelProps } from "@plugin-sdk/ui";
import { getContentPanel } from "@plugins";

/** Registry-style view of a content unit (PyPI for Python, Maven Central for Maven, ...). */
export const PluginContentPanel: React.FC<IContentPanelProps> = ({
  href,
  versionHref,
}) => {
  // The registry returns module-level components, so nothing remounts on re-render.
  const panel = getContentPanel(resolvePulpType(href) ?? "") ?? BaseContent;
  return (
    <Suspense fallback={<Spinner aria-label="Loading content" />}>
      {createElement(panel, { href, versionHref })}
    </Suspense>
  );
};

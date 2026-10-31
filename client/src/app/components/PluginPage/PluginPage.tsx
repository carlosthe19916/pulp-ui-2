import type React from "react";
import { createElement, Suspense } from "react";

import { PageSection, Spinner } from "@patternfly/react-core";

import type { INavPage } from "@plugin-sdk/ui";
import { getPluginPage } from "@plugins";

/**
 * The route component of a plugin's own page: the route file stays (file-based routing) and
 * renders the page the plugin registered for it.
 */
export const pluginPage = (to: INavPage["to"]): React.FC => {
  const PluginPageRoute: React.FC = () => {
    // The registry returns module-level components, so nothing remounts on re-render.
    const page = getPluginPage(to);
    return (
      <Suspense
        fallback={
          <PageSection>
            <Spinner aria-label="Loading page" />
          </PageSection>
        }
      >
        {page ? createElement(page) : null}
      </Suspense>
    );
  };
  return PluginPageRoute;
};

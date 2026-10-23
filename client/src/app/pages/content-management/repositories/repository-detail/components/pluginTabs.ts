import type React from "react";

import type { RepositoryResponse } from "@app/client";

import { MavenPathIndexTab } from "./MavenPathIndexTab";
import { PythonBlocklistTab } from "./PythonBlocklistTab";

/** A repository detail tab only one plugin has. */
export interface IPluginTab {
  key: string;
  title: string;
  Tab: React.FC<{ repository: RepositoryResponse }>;
}

/** The plugin-specific repository tab, keyed by repository pulp_type. */
export const TAB_BY_REPOSITORY_TYPE: Record<string, IPluginTab> = {
  "maven.maven": {
    key: "path-index",
    title: "Path index",
    Tab: MavenPathIndexTab,
  },
  "python.python": {
    key: "blocklist",
    title: "Blocklist",
    Tab: PythonBlocklistTab,
  },
};

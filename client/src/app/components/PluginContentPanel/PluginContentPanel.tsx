import type React from "react";

import { resolvePulpType } from "@app/queries/utils/pulpHref";

import { AnsibleContent } from "./AnsibleContent";
import { BaseContent } from "./BaseContent";
import type { IPluginContentProps } from "./contentFields";
import { DebContent } from "./DebContent";
import { FileContent } from "./FileContent";
import { GemContent } from "./GemContent";
import { MavenContent } from "./MavenContent";
import { NpmContent } from "./NpmContent";
import { OstreeContent } from "./OstreeContent";
import { PythonContent } from "./PythonContent";
import { RpmContent } from "./RpmContent";

const PANEL_BY_TYPE: Record<string, React.FC<IPluginContentProps>> = {
  "file.file": FileContent,
  "rpm.package": RpmContent,
  "python.python": PythonContent,
  "deb.package": DebContent,
  "gem.gem": GemContent,
  "npm.package": NpmContent,
  "maven.artifact": MavenContent,
  "ostree.content": OstreeContent,
  "ansible.collection_version": AnsibleContent,
};

/** Registry-style view of a content unit (PyPI for Python, Maven Central for Maven, ...). */
export const PluginContentPanel: React.FC<IPluginContentProps> = ({ href }) => {
  const Panel = PANEL_BY_TYPE[resolvePulpType(href) ?? ""] ?? BaseContent;
  return <Panel href={href} />;
};

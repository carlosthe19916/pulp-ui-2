import type React from "react";

import { resolvePulpType } from "@app/queries/utils/pulpHref";

import { AnsibleContent } from "./AnsibleContent";
import {
  AnsibleNamespaceContent,
  AnsibleRoleContent,
} from "./AnsibleMetadataContent";
import { BaseContent } from "./BaseContent";
import {
  ContainerManifestContent,
  ContainerTagContent,
} from "./ContainerContent";
import type { IPluginContentProps } from "./contentFields";
import { DebContent } from "./DebContent";
import {
  DebReleaseContent,
  DebSourcePackageContent,
} from "./DebMetadataContent";
import { FileContent } from "./FileContent";
import { GemContent } from "./GemContent";
import { HuggingFaceContent } from "./HuggingFaceContent";
import { MavenContent } from "./MavenContent";
import { MavenPackageContent } from "./MavenPackageContent";
import { NpmContent } from "./NpmContent";
import { OstreeContent } from "./OstreeContent";
import { OstreeRefContent } from "./OstreeRefContent";
import { PythonContent } from "./PythonContent";
import { RpmContent } from "./RpmContent";
import {
  RpmAdvisoryContent,
  RpmModulemdContent,
  RpmPackageGroupContent,
} from "./RpmMetadataContent";

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
  "ansible.namespace": AnsibleNamespaceContent,
  "ansible.role": AnsibleRoleContent,
  "container.tag": ContainerTagContent,
  "container.manifest": ContainerManifestContent,
  "rpm.advisory": RpmAdvisoryContent,
  "rpm.modulemd": RpmModulemdContent,
  "rpm.packagegroup": RpmPackageGroupContent,
  "deb.release": DebReleaseContent,
  "deb.source_package": DebSourcePackageContent,
  "maven.package": MavenPackageContent,
  "ostree.refs": OstreeRefContent,
  "hugging_face.hugging-face": HuggingFaceContent,
};

/** Registry-style view of a content unit (PyPI for Python, Maven Central for Maven, ...). */
export const PluginContentPanel: React.FC<IPluginContentProps> = ({ href }) => {
  const Panel = PANEL_BY_TYPE[resolvePulpType(href) ?? ""] ?? BaseContent;
  return <Panel href={href} />;
};

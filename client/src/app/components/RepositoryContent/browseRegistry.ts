import type { ContentSummaryResponse } from "@app/client";
import { summaryEntries } from "@app/utils/contentSummary";

import {
  AnsibleCollections,
  AnsibleNamespaces,
  AnsibleRoles,
} from "./AnsibleBrowse";
import type { IBrowseSection, IPluginBrowse } from "./browseTypes";
import { ContainerManifests, ContainerTags } from "./ContainerBrowse";
import { DebPackages, DebReleases, DebSourcePackages } from "./DebBrowse";
import { FileFiles } from "./FileBrowse";
import { GemGems } from "./GemBrowse";
import {
  HuggingFaceDatasets,
  HuggingFaceModels,
  HuggingFaceSpaces,
} from "./HuggingFaceBrowse";
import { MavenArtifacts } from "./MavenBrowse";
import { NpmPackages } from "./NpmBrowse";
import { OstreeBranches } from "./OstreeBrowse";
import { PythonPackages } from "./PythonBrowse";
import {
  RpmAdvisories,
  RpmModuleStreams,
  RpmPackageGroups,
  RpmPackages,
} from "./RpmBrowse";

const HUGGING_FACE = ["hugging_face.hugging-face"];

const container: IPluginBrowse = {
  sections: [
    {
      key: "tags",
      title: "Tags",
      pulpTypes: ["container.tag"],
      View: ContainerTags,
    },
    {
      key: "manifests",
      title: "Manifests",
      pulpTypes: ["container.manifest"],
      View: ContainerManifests,
    },
  ],
};

/**
 * Each plugin's Browse sub-tabs, keyed by the repository's `pulp_type` (the catalog's
 * repository types). Order is the sub-tab order; the first one with content is the default.
 */
const BROWSE_BY_REPOSITORY_TYPE: Record<string, IPluginBrowse> = {
  "ansible.ansible": {
    sections: [
      {
        key: "collections",
        title: "Collections",
        pulpTypes: ["ansible.collection_version"],
        View: AnsibleCollections,
      },
      {
        key: "namespaces",
        title: "Namespaces",
        pulpTypes: ["ansible.namespace"],
        View: AnsibleNamespaces,
      },
      {
        key: "roles",
        title: "Roles",
        pulpTypes: ["ansible.role"],
        View: AnsibleRoles,
      },
    ],
  },
  "container.container": container,
  "container.container-push": container,
  "rpm.rpm": {
    sections: [
      {
        key: "packages",
        title: "Packages",
        pulpTypes: ["rpm.package"],
        View: RpmPackages,
      },
      {
        key: "advisories",
        title: "Advisories",
        pulpTypes: ["rpm.advisory"],
        View: RpmAdvisories,
      },
      {
        key: "modules",
        title: "Module streams",
        pulpTypes: ["rpm.modulemd"],
        View: RpmModuleStreams,
      },
      {
        key: "groups",
        title: "Package groups",
        pulpTypes: ["rpm.packagegroup"],
        View: RpmPackageGroups,
      },
    ],
  },
  "deb.deb": {
    sections: [
      {
        key: "releases",
        title: "Releases",
        pulpTypes: ["deb.release"],
        View: DebReleases,
      },
      {
        key: "packages",
        title: "Packages",
        pulpTypes: ["deb.package"],
        View: DebPackages,
      },
      {
        key: "sources",
        title: "Source packages",
        pulpTypes: ["deb.source_package"],
        View: DebSourcePackages,
      },
    ],
  },
  "python.python": {
    sections: [
      {
        key: "packages",
        title: "Packages",
        pulpTypes: ["python.python"],
        View: PythonPackages,
      },
    ],
  },
  "file.file": {
    sections: [
      {
        key: "files",
        title: "Files",
        pulpTypes: ["file.file"],
        View: FileFiles,
      },
    ],
  },
  "maven.maven": {
    sections: [
      {
        key: "artifacts",
        title: "Artifacts",
        pulpTypes: ["maven.package", "maven.artifact"],
        View: MavenArtifacts,
      },
    ],
  },
  "npm.npm": {
    sections: [
      {
        key: "packages",
        title: "Packages",
        pulpTypes: ["npm.package"],
        View: NpmPackages,
      },
    ],
  },
  "gem.gem": {
    sections: [
      { key: "gems", title: "Gems", pulpTypes: ["gem.gem"], View: GemGems },
    ],
  },
  "ostree.ostree": {
    sections: [
      {
        key: "branches",
        title: "Branches",
        pulpTypes: ["ostree.refs"],
        View: OstreeBranches,
      },
    ],
  },
  // The Hub's own navigation. All three share one content type, so no per-tab counts.
  "hugging_face.hugging-face": {
    sections: [
      {
        key: "models",
        title: "Models",
        pulpTypes: HUGGING_FACE,
        showCount: false,
        View: HuggingFaceModels,
      },
      {
        key: "datasets",
        title: "Datasets",
        pulpTypes: HUGGING_FACE,
        showCount: false,
        View: HuggingFaceDatasets,
      },
      {
        key: "spaces",
        title: "Spaces",
        pulpTypes: HUGGING_FACE,
        showCount: false,
        View: HuggingFaceSpaces,
      },
    ],
  },
};

export const getPluginBrowse = (
  repositoryType: string,
): IPluginBrowse | undefined => BROWSE_BY_REPOSITORY_TYPE[repositoryType];

/** Sections whose content types are present in the version, each with its summed count. */
export const visibleSections = ({
  sections,
  summary,
}: {
  sections: IBrowseSection[];
  summary?: ContentSummaryResponse;
}): { section: IBrowseSection; count: number }[] => {
  const counts = new Map(
    summaryEntries(summary?.present).map((entry) => [
      entry.pulpType,
      entry.count,
    ]),
  );
  return sections
    .map((section) => ({
      section,
      count: section.pulpTypes.reduce(
        (total, pulpType) => total + (counts.get(pulpType) ?? 0),
        0,
      ),
    }))
    .filter(({ count }) => count > 0);
};

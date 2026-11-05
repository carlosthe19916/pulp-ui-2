import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docsSidebar: [
    "intro",
    {
      type: "category",
      label: "Deploy",
      collapsed: false,
      items: [
        "running-pulp-ui/container",
        "running-pulp-ui/environment",
        "running-pulp-ui/authentication",
      ],
    },
    {
      type: "category",
      label: "Concepts",
      link: { type: "doc", id: "concepts/index" },
      collapsed: false,
      items: [
        "concepts/download-policies",
        "concepts/what-clients-see",
        "concepts/access-control",
        "concepts/disconnected",
        "concepts/disk",
        "concepts/operating",
      ],
    },
    {
      type: "category",
      label: "Tutorials",
      link: { type: "doc", id: "tutorials/index" },
      items: [
        "tutorials/maven",
        "tutorials/npm",
        "tutorials/python",
        "tutorials/container",
        "tutorials/rpm",
        "tutorials/deb",
        "tutorials/gem",
        "tutorials/ansible",
        "tutorials/file",
        "tutorials/hugging_face",
        "tutorials/ostree",
      ],
    },
    "releases",
  ],
};

export default sidebars;

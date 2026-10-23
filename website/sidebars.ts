import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docsSidebar: [
    "intro",
    {
      type: "category",
      label: "Getting started",
      collapsed: false,
      items: ["getting-started/installation", "getting-started/first-steps"],
    },
    {
      type: "category",
      label: "Configuration",
      items: [
        "configuration/environment",
        "configuration/authentication",
        "configuration/branding",
      ],
    },
    {
      type: "category",
      label: "User guide",
      items: [
        "user-guide/overview",
        "user-guide/remotes",
        "user-guide/repositories",
        "user-guide/publications",
        "user-guide/distributions",
        "user-guide/content",
        "user-guide/tasks",
        "user-guide/domains",
        "user-guide/access-management",
      ],
    },
  ],
};

export default sidebars;

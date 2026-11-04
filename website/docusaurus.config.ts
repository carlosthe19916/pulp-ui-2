import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

const GITHUB_URL = "https://github.com/carlosthe19916/pulp-ui-2";

const config: Config = {
  title: "Pulp UI",
  tagline: "A modern web console for the Pulp artifact repository manager",
  favicon: "img/favicon.ico",

  future: {
    v4: true,
  },

  url: "https://carlosthe19916.github.io",
  baseUrl: "/pulp-ui-2/",
  organizationName: "carlosthe19916",
  projectName: "pulp-ui-2",
  trailingSlash: false,

  onBrokenLinks: "throw",
  onBrokenAnchors: "throw",

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "throw",
    },
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  stylesheets: [
    "https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;700;900&family=Red+Hat+Mono:wght@400;500&family=Red+Hat+Text:wght@400;500;700&display=swap",
  ],

  plugins: ["./plugins/tailwind.ts"],

  themes: [
    [
      // Build-time, fully local search index (no external crawler or service).
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        indexBlog: true,
        indexPages: true,
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: `${GITHUB_URL}/tree/main/website/`,
        },
        blog: {
          showReadingTime: true,
          blogTitle: "Pulp UI blog",
          blogDescription:
            "Notes on building a web console for the Pulp artifact repository manager.",
          editUrl: `${GITHUB_URL}/tree/main/website/`,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          onInlineTags: "throw",
          onInlineAuthors: "throw",
          onUntruncatedBlogPosts: "throw",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/pulp_logo.png",
    metadata: [
      {
        name: "keywords",
        content:
          "pulp, pulp ui, pulp project, repository manager, artifact repository, rpm, container, ansible, python, pypi, deb, maven, npm, patternfly, artifactory alternative, nexus alternative",
      },
      {
        name: "description",
        content:
          "Pulp UI is a modern web console for Pulp, the open source platform for managing repositories of software packages (RPM, container, Ansible, Python, and more).",
      },
    ],
    announcementBar: {
      id: "work_in_progress",
      content:
        "⚠️ This website is a work in progress. Its content might not be accurate yet.",
      backgroundColor: "var(--announcement-bar-background)",
      textColor: "var(--announcement-bar-color)",
      isCloseable: false,
    },
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Pulp UI",
      logo: {
        alt: "Pulp logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "Docs",
        },
        {
          to: "/#features",
          label: "Features",
          position: "left",
          activeBaseRegex: "^/pulp-ui-2/#features$",
        },
        {
          to: "/blog",
          label: "Blog",
          position: "left",
        },
        {
          href: "https://pulpproject.org/",
          label: "Pulp Project",
          position: "right",
        },
        {
          href: GITHUB_URL,
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            { label: "Introduction", to: "/docs/intro" },
            { label: "Concepts", to: "/docs/concepts" },
            {
              label: "Installation",
              to: "/docs/getting-started/installation",
            },
            { label: "Using Pulp", to: "/docs/using-pulp" },
            { label: "Administration", to: "/docs/administration" },
            {
              label: "Running Pulp UI",
              to: "/docs/running-pulp-ui/installation",
            },
          ],
        },
        {
          title: "Project",
          items: [
            { label: "Blog", to: "/blog" },
            { label: "GitHub", href: GITHUB_URL },
            { label: "Report an issue", href: `${GITHUB_URL}/issues` },
          ],
        },
        {
          title: "Related",
          items: [{ label: "Pulp Project", href: "https://pulpproject.org/" }],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Carlos Feria. Licensed under Apache 2.0.<br />Pulp UI is an independent community project. It is not an official Pulp Project product and is not endorsed by the Pulp Project.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ["bash", "yaml"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

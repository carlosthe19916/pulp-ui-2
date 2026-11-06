import React from "react";

import Link from "@docusaurus/Link";

const CONTENT_TYPES = [
  { label: "RPM", slug: "rpm" },
  { label: "Container", slug: "container" },
  { label: "Python", slug: "python" },
  { label: "Ansible", slug: "ansible" },
  { label: "Debian", slug: "deb" },
  { label: "Maven", slug: "maven" },
  { label: "npm", slug: "npm" },
  { label: "RubyGems", slug: "gem" },
  { label: "OSTree", slug: "ostree" },
  { label: "Hugging Face", slug: "hugging_face" },
  { label: "Files", slug: "file" },
];

export default function ContentTypes(): React.ReactElement {
  return (
    <section
      data-testid="home-content-types"
      className="border-y border-line bg-page py-10"
    >
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-5 text-center text-sm text-fg-muted">
          Works with every Pulp content plugin
        </p>
        <ul className="m-0 flex list-none flex-wrap justify-center gap-x-8 gap-y-3 p-0">
          {CONTENT_TYPES.map(({ label, slug }) => (
            <li key={slug} className="m-0">
              <Link
                to={`/docs/tutorials/${slug}`}
                className="font-display text-lg font-medium text-fg-subtle no-underline transition-colors hover:text-accent hover:no-underline"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

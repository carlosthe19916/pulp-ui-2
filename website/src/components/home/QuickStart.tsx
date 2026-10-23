import React from "react";

import Link from "@docusaurus/Link";
import CodeBlock from "@theme/CodeBlock";
import { Check } from "lucide-react";

const POINTS = [
  "Single container image, no database of its own",
  "Connects to your existing Pulp 3 server",
  "Basic or OpenID Connect authentication",
  "Custom branding at build time",
];

export default function QuickStart(): React.ReactElement {
  return (
    <section className="py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
        <div>
          <p className="font-display text-sm font-medium tracking-widest text-brand-50 uppercase dark:text-brand-30">
            Quick start
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Up and running in minutes
          </h2>
          <p className="mt-4 text-lg text-gray-60 dark:text-gray-30">
            Pulp UI ships as a lightweight container. Point it at your Pulp API
            and open your browser.
          </p>
          <ul className="mt-6 list-none space-y-3 p-0">
            {POINTS.map((point) => (
              <li key={point} className="m-0 flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-50/15 text-green-50 dark:text-green-30">
                  <Check size={16} />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <Link
            to="/docs/getting-started/installation"
            className="mt-8 inline-block font-display font-medium"
          >
            Read the installation guide →
          </Link>
        </div>
        <div className="min-w-0">
          <CodeBlock language="bash" title="Terminal">
            {`podman run -d --name pulp-ui \\
  -p 8080:8080 \\
  -e PULP_API_URL=https://pulp.example.com \\
  -e AUTH=basic \\
  ghcr.io/carlosthe19916/pulp-ui-2:latest

# Open http://localhost:8080`}
          </CodeBlock>
        </div>
      </div>
    </section>
  );
}

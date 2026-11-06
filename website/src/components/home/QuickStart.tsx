import React from "react";

import Link from "@docusaurus/Link";
import useBrokenLinks from "@docusaurus/useBrokenLinks";
import { ArrowRight, Check } from "lucide-react";

import SectionHeading from "./SectionHeading";
import Terminal from "./Terminal";

const POINTS = [
  "A single container image, no database of its own",
  "Connects to your existing Pulp 3 server",
  "Basic or OpenID Connect authentication",
  "Your own logo and product name at build time",
];

const COMMAND = `podman run -d --name pulp-ui \\
    -p 8080:8080 \\
    -e PULP_API_URL=https://pulp.example.com \\
    -e AUTH=basic \\
    ghcr.io/carlosthe19916/pulp-ui-2:latest`;

export default function QuickStart(): React.ReactElement {
  useBrokenLinks().collectAnchor("quick-start");
  return (
    <section
      id="quick-start"
      data-testid="home-quick-start"
      className="scroll-mt-24 bg-page pt-8 pb-24 sm:pb-32"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Quick start"
            title="Running in one command"
            description="Pulp UI ships as a lightweight container. Point it at your Pulp API and open your browser."
          />
          <ul className="m-0 mt-8 list-none space-y-3 p-0">
            {POINTS.map((point) => (
              <li key={point} className="m-0 flex items-start gap-3 text-fg">
                <Check
                  size={18}
                  aria-hidden
                  className="mt-1 shrink-0 text-accent"
                />
                {point}
              </li>
            ))}
          </ul>
          <Link
            to="/docs/running-pulp-ui/container"
            className="mt-8 inline-flex items-center gap-1.5 font-display font-medium text-accent no-underline hover:text-accent-hover hover:no-underline"
          >
            Read the installation guide
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <div className="min-w-0">
          <Terminal command={COMMAND} comment="Open http://localhost:8080" />
        </div>
      </div>
    </section>
  );
}

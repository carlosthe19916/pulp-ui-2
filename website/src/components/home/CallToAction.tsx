import React from "react";

import Link from "@docusaurus/Link";
import { ArrowRight } from "lucide-react";

export default function CallToAction(): React.ReactElement {
  return (
    <section data-testid="home-cta" className="bg-page px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl rounded-2xl border border-line bg-page-alt px-8 py-16 text-center sm:px-16">
        <h2 className="mb-0 font-display text-3xl font-bold tracking-tight text-balance text-fg sm:text-4xl">
          Give your Pulp server a console
        </h2>
        <p className="mx-auto mt-4 mb-0 max-w-xl text-lg text-balance text-fg-subtle">
          Install Pulp UI next to Pulp, or follow a tutorial for the content
          type you work with.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/docs/running-pulp-ui/container"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-display font-medium text-on-accent no-underline transition-colors hover:bg-accent-hover hover:text-on-accent hover:no-underline"
          >
            Get started
            <ArrowRight size={18} aria-hidden />
          </Link>
          <Link
            to="/docs/tutorials"
            className="inline-flex items-center rounded-full border border-line-strong bg-surface px-6 py-3 font-display font-medium text-fg no-underline transition-colors hover:border-fg-muted hover:text-fg hover:no-underline"
          >
            Browse tutorials
          </Link>
        </div>
      </div>
    </section>
  );
}

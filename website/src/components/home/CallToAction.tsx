import React from "react";

import Link from "@docusaurus/Link";

export default function CallToAction(): React.ReactElement {
  return (
    <section data-testid="home-cta" className="px-6 pb-24">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-gradient-to-r from-brand-60 via-brand-50 to-purple-50 px-8 py-16 text-center text-white sm:px-16">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Ready to take control of your content?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-10">
          Install Pulp UI next to your Pulp server and start managing
          repositories from the browser today.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/docs/getting-started/installation"
            className="rounded-full bg-white px-6 py-3 font-display font-medium text-brand-60 no-underline transition hover:bg-brand-10 hover:text-brand-70 hover:no-underline"
          >
            Get started
          </Link>
          <Link
            to="/docs/intro"
            className="rounded-full border border-white/60 px-6 py-3 font-display font-medium text-white no-underline transition hover:bg-white/10 hover:text-white hover:no-underline"
          >
            Read the docs
          </Link>
        </div>
      </div>
    </section>
  );
}

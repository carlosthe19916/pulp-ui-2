import React from "react";

import Link from "@docusaurus/Link";
import { ArrowRight } from "lucide-react";

import GithubIcon from "./GithubIcon";
import ProductPreview from "./ProductPreview";

export default function Hero(): React.ReactElement {
  return (
    <section
      data-testid="home-hero"
      className="relative overflow-hidden bg-gray-95 text-white"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,102,204,0.55),transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(94,64,190,0.35),transparent_55%)]"
      />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pt-20 pb-24 lg:grid-cols-2 lg:items-center lg:pt-28 lg:pb-32">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-brand-20">
            <span className="h-2 w-2 rounded-full bg-green-30" />
            Independent community project · Apache 2.0
          </span>
          <h1 className="mt-6 font-display text-4xl leading-tight font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Every artifact you manage with Pulp.{" "}
            <span className="bg-gradient-to-r from-brand-30 to-purple-30 bg-clip-text text-transparent">
              One console.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-30">
            Pulp UI is an independent, community-built web interface for Pulp.
            Sync from upstream remotes, version your repositories, publish and
            distribute RPMs, containers, Python packages, Ansible collections
            and more — without touching the REST API.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/docs/getting-started/installation"
              className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-6 py-3 font-display font-medium text-white no-underline transition hover:bg-brand-60 hover:text-white hover:no-underline"
            >
              Get started
              <ArrowRight size={18} />
            </Link>
            <Link
              href="https://github.com/carlosthe19916/pulp-ui-2"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 font-display font-medium text-white no-underline transition hover:border-white hover:bg-white/10 hover:text-white hover:no-underline"
            >
              <GithubIcon />
              View on GitHub
            </Link>
          </div>
        </div>
        <ProductPreview />
      </div>
    </section>
  );
}

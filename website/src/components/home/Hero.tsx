import React from "react";

import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { ArrowRight } from "lucide-react";

import GithubIcon from "./GithubIcon";

function HeroVideo(): React.ReactElement {
  const src = useBaseUrl("/videos/home/pulp-ui-next.mp4");
  const poster = useBaseUrl("/videos/home/pulp-ui-next-poster.jpg");
  return (
    <div className="overflow-hidden rounded-xl border border-line-strong bg-surface shadow-[0_24px_64px_-24px_rgba(0,0,0,0.35)]">
      <div
        aria-hidden
        className="flex items-center gap-1.5 border-b border-line px-4 py-3"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
      </div>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- the homepage plays this film with captions off */}
      <video
        data-testid="home-hero-video"
        className="block aspect-video w-full bg-black"
        controls
        playsInline
        preload="metadata"
        poster={poster}
        src={src}
        aria-label="Pulp and Pulp UI: where artifacts live, and the console for managing them"
      />
    </div>
  );
}

export default function Hero(): React.ReactElement {
  return (
    <section
      data-testid="home-hero"
      className="relative overflow-hidden bg-page"
    >
      <div
        aria-hidden
        className="home-hero-backdrop pointer-events-none absolute inset-0"
      />
      <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm text-fg-subtle">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            The web console for Pulp
          </p>
          <h1 className="mb-0 font-display text-4xl leading-[1.1] font-bold tracking-tight text-balance text-fg sm:text-6xl">
            Every Pulp repository,
            <br className="hidden sm:block" />{" "}
            <span className="text-accent">one console.</span>
          </h1>
          <p className="mx-auto mt-6 mb-0 max-w-2xl text-lg leading-relaxed text-balance text-fg-subtle sm:text-xl">
            Mirror upstream sources, version and promote content, and serve
            RPMs, container images, Python packages, Ansible collections and
            more, all from your browser.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="#quick-start"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-display font-medium text-on-accent no-underline transition-colors hover:bg-accent-hover hover:text-on-accent hover:no-underline"
            >
              Get started
              <ArrowRight size={18} aria-hidden />
            </Link>
            <Link
              href="https://github.com/carlosthe19916/pulp-ui-2"
              className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-6 py-3 font-display font-medium text-fg no-underline transition-colors hover:border-fg-muted hover:text-fg hover:no-underline"
            >
              <GithubIcon />
              View on GitHub
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-16 max-w-5xl sm:mt-20">
          <HeroVideo />
        </div>
      </div>
    </section>
  );
}

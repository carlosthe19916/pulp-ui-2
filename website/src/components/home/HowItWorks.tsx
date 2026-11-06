import React from "react";

import SectionHeading from "./SectionHeading";

const STEPS = [
  {
    term: "Remote",
    title: "Connect an upstream",
    description:
      "Point Pulp at a CDN, registry, PyPI, Galaxy or a server of your own.",
  },
  {
    term: "Repository",
    title: "Sync and version",
    description:
      "Pull content in. Each sync produces a new, immutable repository version.",
  },
  {
    term: "Distribution",
    title: "Serve to clients",
    description:
      "Expose the version you trust at a stable URL, and promote new ones when ready.",
  },
];

export default function HowItWorks(): React.ReactElement {
  return (
    <section
      data-testid="home-how-it-works"
      className="border-y border-line bg-page-alt py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="How it works"
          title="From upstream to production in three steps"
        />
        <ol className="m-0 mt-16 grid list-none gap-6 p-0 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.term}
              className="m-0 rounded-xl border border-line bg-page p-8"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent font-display text-sm font-bold text-accent">
                  {index + 1}
                </span>
                <span className="font-mono text-sm text-fg-muted">
                  {step.term}
                </span>
              </div>
              <h3 className="mt-6 mb-2 font-display text-xl font-medium text-fg">
                {step.title}
              </h3>
              <p className="mb-0 leading-relaxed text-fg-subtle">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

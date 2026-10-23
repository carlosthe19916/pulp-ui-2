import React from "react";

const STEPS = [
  {
    title: "Connect a remote",
    description:
      "Point Pulp at an upstream source — a CDN, registry, PyPI, Galaxy or your own server.",
  },
  {
    title: "Sync into a repository",
    description:
      "Pull content into a repository. Each sync produces a new, immutable repository version.",
  },
  {
    title: "Distribute to clients",
    description:
      "Publish the version you trust and expose it at a stable URL for dnf, podman, pip and friends.",
  },
];

export default function HowItWorks(): React.ReactElement {
  return (
    <section className="bg-gray-10 py-24 dark:bg-gray-90">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-sm font-medium tracking-widest text-brand-50 uppercase dark:text-brand-30">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            From upstream to production in three steps
          </h2>
        </div>
        <ol className="mt-16 grid list-none gap-8 p-0 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative m-0">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 font-display text-lg font-bold text-white">
                  {index + 1}
                </span>
                <span className="hidden h-px flex-1 bg-gray-30 md:block dark:bg-gray-70" />
              </div>
              <h3 className="mt-6 text-xl font-medium">{step.title}</h3>
              <p className="text-gray-60 dark:text-gray-30">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

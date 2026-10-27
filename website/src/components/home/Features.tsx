import React from "react";

import useBrokenLinks from "@docusaurus/useBrokenLinks";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Building2,
  Cloud,
  GitBranch,
  KeyRound,
  Search,
  Send,
  Users,
} from "lucide-react";

interface IFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: IFeature[] = [
  {
    icon: Cloud,
    title: "Sync from upstream",
    description:
      "Define remotes for public or private sources and mirror them on demand, immediately or lazily.",
  },
  {
    icon: GitBranch,
    title: "Versioned repositories",
    description:
      "Every change creates an immutable repository version. Inspect exactly what each version contains.",
  },
  {
    icon: Send,
    title: "Publish & distribute",
    description:
      "Turn repository versions into publications and serve them to clients through distributions.",
  },
  {
    icon: Search,
    title: "Browse content",
    description:
      "Find and filter packages, images and collections with views tailored to each content type.",
  },
  {
    icon: Activity,
    title: "Task monitoring",
    description:
      "Follow syncs, publishes and deletions in real time and inspect failures without leaving the UI.",
  },
  {
    icon: Building2,
    title: "Multi-tenant domains",
    description:
      "Isolate teams and environments with Pulp domains and switch between them in one click.",
  },
  {
    icon: Users,
    title: "Users, groups & roles",
    description:
      "Manage who can do what with Pulp's role-based access control, straight from the browser.",
  },
  {
    icon: KeyRound,
    title: "Enterprise sign-in",
    description:
      "Log in with Pulp credentials or plug into your identity provider through OpenID Connect.",
  },
];

export default function Features(): React.ReactElement {
  useBrokenLinks().collectAnchor("features");
  return (
    <section
      id="features"
      data-testid="home-features"
      className="scroll-mt-16 py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-sm font-medium tracking-widest text-brand-50 uppercase dark:text-brand-30">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Everything you need to run your artifact pipeline
          </h2>
          <p className="mt-4 text-lg text-gray-60 dark:text-gray-30">
            Pulp UI brings the full power of Pulp to a clean, PatternFly-based
            console that's built for daily use.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-xl border border-gray-20 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-40 hover:shadow-lg dark:border-gray-70 dark:bg-gray-90 dark:hover:border-brand-40"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-10 text-brand-50 dark:bg-brand-50/20 dark:text-brand-30">
                <Icon size={22} />
              </div>
              <h3 className="mt-5 text-lg font-medium">{title}</h3>
              <p className="mb-0 text-sm leading-relaxed text-gray-60 dark:text-gray-30">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

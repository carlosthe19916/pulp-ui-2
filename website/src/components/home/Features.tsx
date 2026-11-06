import React from "react";

import useBrokenLinks from "@docusaurus/useBrokenLinks";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CloudDownload,
  FolderSearch,
  History,
  Send,
  ShieldCheck,
} from "lucide-react";

import SectionHeading from "./SectionHeading";

interface IFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: IFeature[] = [
  {
    icon: CloudDownload,
    title: "Mirror upstream sources",
    description:
      "Define remotes for public or private sources and sync them on demand, in full or on first request.",
  },
  {
    icon: History,
    title: "Versioned repositories",
    description:
      "Every change creates an immutable version. See what each one contains and roll back in a click.",
  },
  {
    icon: Send,
    title: "Publish and distribute",
    description:
      "Serve the version you trust at a stable URL that dnf, podman, pip and other clients understand.",
  },
  {
    icon: FolderSearch,
    title: "Browse any content type",
    description:
      "Search packages, images and collections with views tailored to each Pulp plugin.",
  },
  {
    icon: Activity,
    title: "Follow every task",
    description:
      "Watch syncs and publishes run in real time and read failures without leaving the console.",
  },
  {
    icon: ShieldCheck,
    title: "Domains and access control",
    description:
      "Isolate teams with domains, grant roles to users and groups, and sign in through OpenID Connect.",
  },
];

export default function Features(): React.ReactElement {
  useBrokenLinks().collectAnchor("features");
  return (
    <section
      id="features"
      data-testid="home-features"
      className="scroll-mt-16 bg-page py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Features"
          title="Everything Pulp does, in a console built for daily use"
          description="Pulp UI covers the full content lifecycle on top of your existing Pulp server, using the same PatternFly design as the rest of your tools."
        />
        <div className="mt-16 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-page p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Icon size={20} aria-hidden />
              </div>
              <h3 className="mt-5 mb-2 font-display text-lg font-medium text-fg">
                {title}
              </h3>
              <p className="mb-0 leading-relaxed text-fg-subtle">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

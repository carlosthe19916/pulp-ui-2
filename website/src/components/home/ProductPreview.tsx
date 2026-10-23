import React from "react";

import { Boxes, CheckCircle2, Clock, Loader2 } from "lucide-react";

const ROWS = [
  { name: "rhel9-baseos", type: "RPM", version: 42, status: "synced" },
  { name: "ubi-images", type: "Container", version: 17, status: "syncing" },
  { name: "internal-pypi", type: "Python", version: 128, status: "synced" },
  { name: "galaxy-certified", type: "Ansible", version: 9, status: "queued" },
  { name: "debian-bookworm", type: "Debian", version: 6, status: "synced" },
];

const NAV = [
  "Remotes",
  "Repositories",
  "Publications",
  "Distributions",
  "Content",
  "Tasks",
];

function Status({ status }: { status: string }): React.ReactElement {
  if (status === "synced") {
    return (
      <span className="inline-flex items-center gap-1 text-green-30">
        <CheckCircle2 size={14} /> Synced
      </span>
    );
  }
  if (status === "syncing") {
    return (
      <span className="inline-flex items-center gap-1 text-brand-30">
        <Loader2 size={14} className="animate-spin" /> Syncing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-gray-40">
      <Clock size={14} /> Queued
    </span>
  );
}

// Illustrative mock of the repository list, not a screenshot.
export default function ProductPreview(): React.ReactElement {
  return (
    <div
      aria-hidden
      className="rounded-xl border border-white/10 bg-gray-90 shadow-2xl shadow-brand-50/20"
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-gray-60" />
        <span className="h-3 w-3 rounded-full bg-gray-60" />
        <span className="h-3 w-3 rounded-full bg-gray-60" />
        <span className="ml-4 hidden rounded-md bg-gray-80 px-3 py-1 font-mono text-xs text-gray-40 sm:block">
          pulp.example.com/content-management/default/repositories
        </span>
      </div>
      <div className="flex">
        <nav className="hidden w-40 shrink-0 border-r border-white/10 py-4 text-sm md:block">
          {NAV.map((item) => (
            <div
              key={item}
              className={
                item === "Repositories"
                  ? "border-l-2 border-brand-40 bg-white/5 px-4 py-2 text-white"
                  : "border-l-2 border-transparent px-4 py-2 text-gray-40"
              }
            >
              {item}
            </div>
          ))}
        </nav>
        <div className="min-w-0 flex-1 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-display text-lg text-white">
              <Boxes size={20} className="text-brand-30" /> Repositories
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs text-white">
              Create repository
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-white/10 text-sm">
            <div className="grid grid-cols-[1.6fr_1fr_0.6fr_1fr] gap-2 bg-white/5 px-3 py-2 text-xs tracking-wide text-gray-40 uppercase">
              <span>Name</span>
              <span>Type</span>
              <span>Version</span>
              <span>Status</span>
            </div>
            {ROWS.map((row) => (
              <div
                key={row.name}
                className="grid grid-cols-[1.6fr_1fr_0.6fr_1fr] gap-2 border-t border-white/5 px-3 py-2.5 text-gray-20"
              >
                <span className="truncate text-brand-30">{row.name}</span>
                <span>{row.type}</span>
                <span className="font-mono">{row.version}</span>
                <Status status={row.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

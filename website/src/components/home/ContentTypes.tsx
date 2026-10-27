import React from "react";

const CONTENT_TYPES = [
  "RPM",
  "Container",
  "Python",
  "Ansible",
  "Debian",
  "Maven",
  "npm",
  "Ruby Gems",
  "OSTree",
  "Hugging Face",
  "File",
];

export default function ContentTypes(): React.ReactElement {
  return (
    <section
      data-testid="home-content-types"
      className="border-b border-gray-20 bg-gray-10 py-12 dark:border-gray-80 dark:bg-gray-90"
    >
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center font-display text-sm font-medium tracking-widest text-gray-50 uppercase dark:text-gray-40">
          One interface for every Pulp content plugin
        </p>
        <ul className="mt-6 flex list-none flex-wrap justify-center gap-3 p-0">
          {CONTENT_TYPES.map((type) => (
            <li
              key={type}
              className="m-0 rounded-full border border-gray-30 bg-white px-4 py-2 font-display text-sm font-medium text-gray-70 dark:border-gray-70 dark:bg-gray-80 dark:text-gray-20"
            >
              {type}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

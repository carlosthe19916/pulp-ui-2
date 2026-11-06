import React from "react";

import clsx from "clsx";

interface ISectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: ISectionHeadingProps): React.ReactElement {
  return (
    <div
      className={clsx("max-w-2xl", align === "center" && "mx-auto text-center")}
    >
      <p className="mb-3 font-display text-sm font-medium tracking-wide text-accent">
        {eyebrow}
      </p>
      <h2 className="mb-0 font-display text-3xl font-bold tracking-tight text-balance text-fg sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 mb-0 text-lg leading-relaxed text-pretty text-fg-subtle">
          {description}
        </p>
      )}
    </div>
  );
}

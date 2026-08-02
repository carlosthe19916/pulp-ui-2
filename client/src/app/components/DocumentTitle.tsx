import type React from "react";
import { useEffect } from "react";

import { useBranding } from "@app/hooks/useBranding";

interface DocumentTitleProps {
  title?: string | null;
}

/**
 * Sets `document.title` to `"Page · Brand"` while mounted.
 * Restores the previous title on unmount.
 */
export const DocumentTitle: React.FC<DocumentTitleProps> = ({ title }) => {
  const branding = useBranding();
  const brandTitle = branding?.application?.title || "Pulp";

  useEffect(() => {
    const previous = document.title;
    document.title = title?.trim()
      ? `${title.trim()} · ${brandTitle}`
      : brandTitle;
    return () => {
      document.title = previous;
    };
  }, [title, brandTitle]);

  return null;
};

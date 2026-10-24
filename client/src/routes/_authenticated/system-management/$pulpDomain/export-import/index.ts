import { createFileRoute } from "@tanstack/react-router";

import { ExportImport } from "@app/pages/system-management/export-import/ExportImport";

export const Route = createFileRoute(
  "/_authenticated/system-management/$pulpDomain/export-import/",
)({
  component: ExportImport,
});

import { createFileRoute } from "@tanstack/react-router";

import { ComingSoon } from "@app/pages/resources/ComingSoon";

export const Route = createFileRoute("/browse/")({
  component: () => <ComingSoon title="Content Browser" />,
});

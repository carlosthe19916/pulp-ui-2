import { RouterProvider } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { useAuth } from "@app/context/useAuth";
import { queryClient } from "@app/queries/config";

import type { AppRouter } from "../router";

export function App({ router }: { router: AppRouter }) {
  const auth = useAuth();

  if (auth.isLoading) {
    return <AppPlaceholder />;
  }

  return (
    <>
      <RouterProvider router={router} context={{ queryClient, auth }} />
      <TanStackRouterDevtools router={router} initialIsOpen={false} />
    </>
  );
}

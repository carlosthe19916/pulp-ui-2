import { RouterProvider } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { useAuth } from "@app/hooks/useAuth";
import { queryClient } from "@app/queries/config";

import type { AppRouter } from "../router";

export const App = ({ router }: { router: AppRouter }) => {
  const authContext = useAuth();

  if (authContext.isLoading) {
    return <AppPlaceholder />;
  }

  return (
    <>
      <RouterProvider
        router={router}
        context={{ queryClient, auth: authContext }}
      />
      {import.meta.env.DEV ? (
        <TanStackRouterDevtools router={router} initialIsOpen={false} />
      ) : null}
    </>
  );
};

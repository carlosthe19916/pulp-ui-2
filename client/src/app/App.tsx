import { use } from "react";

import { RouterProvider } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { queryClient } from "@app/queries/config";

import type { AppRouter } from "../router";
import { AuthContext } from "./context/Auth/AuthContext";

export function App({ router }: { router: AppRouter }) {
  const authContext = use(AuthContext);

  if (authContext?.isLoading) {
    return <AppPlaceholder />;
  }

  return (
    <>
      <RouterProvider
        router={router}
        context={{ queryClient, auth: authContext }}
      />
      <TanStackRouterDevtools router={router} initialIsOpen={false} />
    </>
  );
}

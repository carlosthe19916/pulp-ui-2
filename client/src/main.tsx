import React from "react";

import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import "@app/dayjs";
import { queryClient } from "@app/queries/config";
import { AppRoutes } from "@app/Routes";

const container = document.getElementById("root");

// biome-ignore lint/style/noNonNullAssertion: allowed
const root = createRoot(container!);

const persister = createAsyncStoragePersister({
  storage: window.localStorage,
});

const renderApp = () => {
  return root.render(
    <React.StrictMode>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <RouterProvider router={AppRoutes} />
        <ReactQueryDevtools initialIsOpen={false} />
      </PersistQueryClientProvider>
    </React.StrictMode>,
  );
};

renderApp();

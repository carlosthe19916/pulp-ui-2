import React from "react";
import { createRoot } from "react-dom/client";

import { QueryClientProvider } from "@tanstack/react-query";

import "@app/dayjs";
import "@app/descriptors";
import { App } from "@app/App";
import { AuthProvider } from "@app/context/AuthContext";
import { queryClient } from "@app/queries/config";
import { router } from "./router";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider
        onUnauthorized={() => {
          void router.navigate({
            to: "/login",
            search: { redirect: router.state.location.href },
          });
        }}
      >
        <App router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);

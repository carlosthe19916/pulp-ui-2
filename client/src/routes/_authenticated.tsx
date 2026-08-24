import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => {
    const { auth } = context;

    if (!auth || auth.isAuthenticated()) {
      return;
    }

    auth.login(location.href);
  },
  component: () => <Outlet />,
});

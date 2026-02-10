import type React from "react";
import { Outlet } from "react-router-dom";

import { DefaultLayout } from "./layout";

import "@patternfly/patternfly/patternfly-addons.css";
import "@patternfly/patternfly/patternfly.css";

const App: React.FC = () => {
  return (
    <DefaultLayout>
      <Outlet />
    </DefaultLayout>
  );
};

export default App;

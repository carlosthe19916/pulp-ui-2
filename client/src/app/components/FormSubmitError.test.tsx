import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { FormSubmitError } from "./FormSubmitError";

describe("FormSubmitError", () => {
  it("renders nothing when there is no error", async () => {
    const screen = await render(<FormSubmitError error={null} />);
    await expect.element(screen.container).toBeEmptyDOMElement();
  });

  it("renders a danger alert with the error title", async () => {
    const screen = await render(
      <FormSubmitError error={{ title: "Failed to create repository" }} />,
    );
    await expect
      .element(
        screen.getByRole("heading", {
          name: /^Danger alert:\s*Failed to create repository$/,
        }),
      )
      .toBeVisible();
  });

  it("includes the description when present", async () => {
    const screen = await render(
      <FormSubmitError
        error={{
          title: "Failed to create repository",
          description: "A repository with this name already exists.",
        }}
      />,
    );
    await expect
      .element(screen.getByText("A repository with this name already exists."))
      .toBeVisible();
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FormSubmitError } from "./FormSubmitError";

describe("FormSubmitError", () => {
  it("renders nothing when there is no error", () => {
    expect(renderToStaticMarkup(<FormSubmitError error={null} />)).toBe("");
  });

  it("renders a danger alert with the error title", () => {
    const html = renderToStaticMarkup(
      <FormSubmitError error={{ title: "Failed to create repository" }} />,
    );
    expect(html).toContain("Failed to create repository");
    // PatternFly danger alert modifier.
    expect(html).toContain("pf-m-danger");
  });

  it("includes the description when present", () => {
    const html = renderToStaticMarkup(
      <FormSubmitError
        error={{
          title: "Failed to create repository",
          description: "A repository with this name already exists.",
        }}
      />,
    );
    expect(html).toContain("Failed to create repository");
    expect(html).toContain("A repository with this name already exists.");
  });
});

import { describe, expect, it } from "vitest";

import { defineForm } from "../defineForm";
import { testForm } from "../testForm";
import { carryOverValues } from "./carryOver";

describe("carryOverValues", () => {
  it("keeps values whose key and kind exist in both forms", () => {
    const other = defineForm<{ name: string; url: string; token?: string }>()(
      ({ f, s }) => ({
        title: { create: "Create", edit: "Edit" },
        sections: [
          s.essentials([
            f.text("name", { label: "Name" }),
            f.text("url", { label: "URL as text" }),
            f.secret("token", { label: "Token" }),
          ]),
        ],
      }),
    );
    expect(
      carryOverValues({
        from: testForm,
        to: other,
        values: { name: "a", url: "https://a/", password: "x" },
      }),
    ).toEqual({ name: "a" });
  });
});

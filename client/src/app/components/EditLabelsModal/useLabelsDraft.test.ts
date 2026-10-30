import { describe, expect, it } from "vitest";
import { renderHook } from "vitest-browser-react";

import { useLabelsDraft } from "./useLabelsDraft";

describe("useLabelsDraft", () => {
  it("starts clean with the original labels", async () => {
    const { result } = await renderHook(() => useLabelsDraft({ env: "prod" }));

    expect(result.current.draft).toEqual({ env: "prod" });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.diff).toEqual({ toSet: [], toUnset: [] });
  });

  it("adds a new label as a set change", async () => {
    const { result, act } = await renderHook(() => useLabelsDraft({}));

    await act(() => result.current.add({ key: "team", value: "a" }));

    expect(result.current.isDirty).toBe(true);
    expect(result.current.diff).toEqual({
      toSet: [{ key: "team", value: "a" }],
      toUnset: [],
    });
  });

  it("replaces a value for an existing key rather than duplicating it", async () => {
    const { result, act } = await renderHook(() =>
      useLabelsDraft({ env: "dev" }),
    );

    await act(() => result.current.add({ key: "env", value: "prod" }));

    expect(result.current.draft).toEqual({ env: "prod" });
    expect(result.current.diff).toEqual({
      toSet: [{ key: "env", value: "prod" }],
      toUnset: [],
    });
  });

  it("removes a label as an unset change", async () => {
    const { result, act } = await renderHook(() =>
      useLabelsDraft({ env: "prod" }),
    );

    await act(() => result.current.remove("env"));

    expect(result.current.draft).toEqual({});
    expect(result.current.diff).toEqual({ toSet: [], toUnset: ["env"] });
  });
});

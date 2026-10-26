import type { Locator } from "@playwright/test";

/** The role form's permission input: type + Enter adds a tag, "Remove <p>" drops it. */
export class PermissionTags {
  readonly input: Locator;
  private readonly scope: Locator;

  constructor(dialog: Locator) {
    this.scope = dialog;
    this.input = dialog.getByRole("textbox", { name: "Add permission" });
  }

  async add(...permissions: string[]): Promise<void> {
    for (const permission of permissions) {
      await this.input.fill(permission);
      await this.input.press("Enter");
    }
  }

  removeButton(permission: string): Locator {
    return this.scope.getByRole("button", {
      name: `Remove ${permission}`,
      exact: true,
    });
  }

  /** The visible tags, in order (folded tags have no remove button). */
  async visible(): Promise<string[]> {
    const names = await this.scope
      .getByRole("button", { name: /^Remove / })
      .evaluateAll((buttons) =>
        buttons.map((button) => button.getAttribute("aria-label") ?? ""),
      );
    return names.map((name) => name.replace(/^Remove /, ""));
  }

  /** The "N more" / "Show less" overflow toggle of the tag group. */
  overflow(text: string | RegExp): Locator {
    return this.scope.getByRole("button", { name: text });
  }
}

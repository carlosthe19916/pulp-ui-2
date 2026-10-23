import { describe, expect, it } from "vitest";

import { entityTaskKindFromName } from "./useResourceTasks";

describe("entityTaskKindFromName", () => {
  it("maps Pulp task names to the surfaced row operation", () => {
    expect(
      entityTaskKindFromName("pulpcore.app.tasks.base.ageneral_delete"),
    ).toBe("delete");
    expect(
      entityTaskKindFromName("pulpcore.app.tasks.base.ageneral_update"),
    ).toBe("update");
    expect(
      entityTaskKindFromName("pulp_file.app.tasks.synchronizing.synchronize"),
    ).toBe("sync");
    expect(
      entityTaskKindFromName("pulpcore.app.tasks.repository.add_and_remove"),
    ).toBe("modify");
    expect(
      entityTaskKindFromName(
        "pulp_container.app.tasks.recursive_remove.recursive_remove_content",
      ),
    ).toBe("modify");
  });

  it("returns null for other or missing names", () => {
    expect(
      entityTaskKindFromName("pulpcore.app.tasks.repository.repair_version"),
    ).toBeNull();
    expect(entityTaskKindFromName(undefined)).toBeNull();
  });
});

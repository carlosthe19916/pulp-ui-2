import {
  authSection,
  connectionSections,
  nameField,
  POLICY_OPTIONS,
  policyField,
  urlField,
} from "@app/forms/fragments";
import { remoteForm } from "@plugin-sdk/ui";

import { python } from "../../definition";

/**
 * A Python remote syncs from a package index (PyPI or a mirror). Which projects to sync is
 * what matters, so the includes lead.
 */
export const pythonRemoteForm = remoteForm(python.remote["python.python"])(
  ({ f, s }) => ({
    title: { create: "Create Python remote", edit: "Edit Python remote" },
    docsUrl: "https://pulpproject.org/pulp_python/",
    sections: [
      s.essentials([
        nameField(f),
        urlField(f, {
          help: "The package index to sync, e.g. https://pypi.org/.",
        }),
        f.row([
          f.stringList("includes", {
            label: "Include projects",
            help: "Project specifiers to sync, e.g. django or requests>=2.30. Empty syncs the whole index.",
          }),
          f.stringList("excludes", {
            label: "Exclude projects",
            help: "Project specifiers to skip.",
          }),
        ]),
        policyField(f, [
          POLICY_OPTIONS.immediate,
          POLICY_OPTIONS.on_demand,
          POLICY_OPTIONS.streamed,
        ]),
      ]),
      s.collapsible("packages", "Package selection", [
        f.checkboxes("package_types", {
          label: "Package types",
          help: "Empty syncs every package type.",
          options: [
            { value: "bdist_wheel", label: "Wheel (bdist_wheel)" },
            { value: "sdist", label: "Source (sdist)" },
            { value: "bdist_egg", label: "Egg (bdist_egg)" },
            { value: "bdist_dumb", label: "Dumb (bdist_dumb)" },
            { value: "bdist_rpm", label: "RPM (bdist_rpm)" },
            { value: "bdist_msi", label: "MSI (bdist_msi)" },
            {
              value: "bdist_wininst",
              label: "Windows installer (bdist_wininst)",
            },
            { value: "bdist_dmg", label: "DMG (bdist_dmg)" },
          ],
        }),
        f.checkboxes("exclude_platforms", {
          label: "Exclude platforms",
          options: [
            { value: "windows", label: "Windows" },
            { value: "macos", label: "macOS" },
            { value: "freebsd", label: "FreeBSD" },
            { value: "linux", label: "Linux" },
          ],
        }),
        f.row([
          f.number("keep_latest_packages", {
            label: "Latest versions to keep",
            help: "How many of each project's newest versions to sync. 0 keeps all.",
          }),
          f.switch("prereleases", { label: "Include pre-releases" }),
          f.switch("provenance", { label: "Sync provenance" }),
        ]),
      ]),
      s.collapsible("auth", "Authentication", authSection(f)),
      ...connectionSections({ f, s }),
    ],
  }),
);

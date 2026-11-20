# Versioning and branches

Pulp UI follows [Semantic Versioning](https://semver.org/). The git tag is the version: the
release workflow tags a branch and the image build reads the version from that tag, so
`package.json` keeps no real version.

Two major versions are developed at the same time:

- **1.x**, the single-page app (SPA). It is the version people run, and it keeps getting
  features and fixes.
- **2.x**, the server-rendered version with AI features (SSR, CopilotKit). It is built next to
  1.x until it can replace it.

## Branches

```
main   ──●──●──●──●──●──●──●──●──────●   1.x: v1.0.0, v1.0.1, v1.1.0 … weekly ─┐
            \     \ sync  \ sync      \                                        │ cutover
next         ●──●──●──●──●──●──●──●──●──●   2.0: v2.0.0-alpha.1, -beta.1, -rc.1 ┘
                                      release-1.N  ●──●   v1.N.1, v1.N.2 (fixes only)
```

| Branch        | Holds                            | Releases                              | Takes                                         |
| ------------- | -------------------------------- | ------------------------------------- | --------------------------------------------- |
| `main`        | the stable line, 1.x             | `vX.Y.Z` on Fridays                   | feature and fix PRs (squash)                  |
| `next`        | the next major, 2.x              | `vX.0.0-alpha.N`, `-beta.N`, `-rc.N`  | SSR/AI PRs (squash) and the main sync (merge) |
| `release-X.Y` | an older line, after the cutover | `vX.Y.Z` patches, never marked Latest | backport PRs only                             |

## Rules

1. **Changes go forward, never back.** Anything both versions need (a fix, a component, a
   query, a plugin, an e2e spec, an ADR, a rule, a dependency) is merged to `main` once. The
   [sync](.github/workflows/sync-next.yaml) brings it to `next`. Nothing is merged from `next`
   into `main` before the cutover, and nothing is cherry-picked from `main` to `next` by hand.
2. **`next` only takes what is new in 2.x**: the server, SSR and AI. Put that code in new places
   (a server entry, `client/src/server/`, `client/src/ai/`) rather than in edits to shared files.
   Big renames and moves go to `main` first.
3. **Prepare on `main`.** Refactors that make shared code safe to render on a server (no
   `window`, `document` or `localStorage` at module scope, configuration read through `common`)
   are merged to `main`, which keeps the sync small.
4. **ADRs are written on `main`**, 2.x ones too ("Applies from 2.0"), so two branches never
   take the same number.
5. **Generated files are regenerated, never hand-merged**, when a sync conflicts:
   `package-lock.json` (`npm install`), `routeTree.gen.ts` and `client/src/app/client/`
   (`npm run generate`), `.claude/` and `.cursor/` (`npm run rules`).
6. PR titles follow [Conventional Commits](https://www.conventionalcommits.org/), as every
   commit does, and **their type decides the release** (below): pick `feat` or `fix` for what
   users see, not `chore`. 2.x work uses the `ssr` and `ai` scopes: `feat(ai): explain a failed
task`.

### Which branch does my PR target?

| Change                                                   | Target             |
| -------------------------------------------------------- | ------------------ |
| A feature or fix for the current UI                      | `main`             |
| Shared code 2.x also needs (or a refactor that helps it) | `main`             |
| Server, SSR or AI code that only 2.x has                 | `next`             |
| A fix for an older line, after the cutover               | `main`, then label |

## Releases

The [release workflow](.github/workflows/release.yaml) runs every Friday for `main`, and for
`next` when it exists. It looks at the commits merged since the branch's last release, **counts
only those that change what ships** (`client/`, `common/`, `server/`, `branding/`,
`package.json`, `package-lock.json`, `Dockerfile`, `entrypoint.sh`, `.release-major`) and sizes
the release by their type. Who opened the PR, a person or a bot, doesn't matter.

| Commits since the last release that change what ships                                     | `main` releases          |
| ----------------------------------------------------------------------------------------- | ------------------------ |
| at least one `feat` (a breaking `feat!` too)                                              | minor: `v1.4.0`→`v1.5.0` |
| only `fix`, `perf`, `refactor`, `revert`, `build` or `chore(deps)`                        | patch: `v1.4.0`→`v1.4.1` |
| none: only `docs`, `test`, `ci`, `chore(deps-dev)`, other `chore`s, or nothing that ships | nothing                  |

So a week with only Dependabot runtime updates (`chore(deps)`) gives a patch: users get the new
libraries and their security fixes. Updates of build and test tools only (`chore(deps-dev)`)
release nothing. A week with only GitHub Actions or website updates, or only the plugin-version
bump (`plugin-versions.txt` only pins the e2e backend), releases nothing. The major never moves
on its own: it is `.release-major`, changed only to start a new major.

| Branch        | Version                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------- |
| `main`        | `vMAJOR.Y.0` for a feature, `vMAJOR.Y.Z` for fixes, `vMAJOR.0.0` first                       |
| `next`        | `vMAJOR.0.0-<channel>.N`, whatever the type; a channel can't go back (no alpha after a beta) |
| `release-X.Y` | `vX.Y.Z`, always a patch (a backported `feat` too)                                           |

Once `release-X.Y` exists it owns the `X.Y.Z` patches, so `main` releases `X.(Y+1).0` next,
even with fixes only.

To release now, or pick a channel or a version, run it from Actions → Release with:

- `ref`: `main`, `next` or `release-X.Y`;
- `channel`: `alpha`, `beta` or `rc` (only for `next`);
- `version`: a version such as `v2.0.0`. Leave it empty to compute it.

[`next-version.sh`](.github/scripts/next-version.sh) computes the version (tested by
`next-version.test.sh` in CI). A release is marked Latest only when it's the highest stable
version. Its notes start from the previous release on the same branch.

### Urgent fix

Merge the fix to `main`, then run the release workflow with `ref: main`. When `main` has had
only fixes since its last release, that gives a patch (`v1.4.1`) at once.

When `main` already holds an unreleased feature you don't want to ship yet, release the fix
alone from the last release:

1. `git push origin v1.4.0:refs/heads/release-1.4` and `gh label create "backport release-1.4"`.
2. Merge the fix to `main` with the label `backport release-1.4`, then merge the backport PR.
3. Run the release workflow with `ref: release-1.4`: `v1.4.1`. The next Friday `main` releases
   `v1.5.0`, fix included.

Container images (`ghcr.io/<repo>`):

| Image tag           | Points to                                                 |
| ------------------- | --------------------------------------------------------- |
| `1.4.0`, `1.4`, `1` | a stable release (`1.4` and `1` move to the newest patch) |
| `2.0.0-alpha.3`     | a pre-release (it gets only its exact version)            |
| `latest`            | the head of `main`                                        |
| `next`              | the head of `next`                                        |

## Backports

After the cutover, a fix for the older line is merged to `main` first, then copied: the label
`backport release-X.Y` on the PR (before or after the merge) makes the
[backport workflow](.github/workflows/backport.yaml) open a PR to `release-X.Y`. If it doesn't
apply cleanly, the workflow says so on the PR and the backport is done by hand. Release the
patch with the release workflow (`ref: release-X.Y`).

## Cutover: 2.0.0

1. Freeze features on `main`. Its last release, say `v1.14.0`, is the last 1.x minor.
2. Create the branch for the older line and its label:
   `git push origin v1.14.0:refs/heads/release-1.14` and
   `gh label create "backport release-1.14"`.
3. Let the sync bring the last of `main` into `next`, and release `rc` versions from `next`
   until 2.0 is ready.
4. Merge a PR from `next` to `main` with a **merge commit**. `next` already contains `main`, so
   it doesn't conflict, and `.release-major` on `main` becomes `2`.
5. Run the release workflow with `ref: main` and `version: v2.0.0`. The weekly releases go on
   from there (`v2.0.1`, `v2.1.0` …).
6. For 3.x, set `.release-major` to `3` on `next`, and the same cycle starts again.
   Otherwise delete `next`: the sync and the weekly pre-release skip a missing branch.

## Starting the next major

1. `git push origin main:next`.
2. Before protecting the branch, commit `.release-major` set to the new major (`2`) on `next`.
3. Run the release workflow with `ref: next`, which releases `v2.0.0-alpha.1`.

## Repository settings (once)

- **Rulesets** for `main`, `next` and `release-*`: PRs required, the `ci` and `e2e-gate`
  checks required (from GitHub Actions), no force push, no deletion. `main` and `release-*`
  only allow squash merges. `next` allows squash and merge commits, for the sync PR. Without
  `next`'s required checks, auto-merge lands the sync PR before its checks finish, and CI and
  e2e don't run on pushes to `next` (the PR checks are its gate).
- **Allow merge commits** turned on in the repository settings (only `next`'s ruleset uses it).
- **Tags** `v*`: never deleted or moved. Only the release workflow and admins create them.
- **Labels**: `sync-conflict`, and `backport release-X.Y` for each older line.
- **pulp-ui-bot** GitHub App (`BOT_APP_ID`, `BOT_APP_PRIVATE_KEY`): contents, pull requests and
  workflows write. The sync and backport PRs are opened with its token so that CI runs on them,
  and it pushes commits that change workflow files.

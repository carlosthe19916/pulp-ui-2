#!/usr/bin/env bash
# Tests next-version.sh against a throwaway git repository walked through VERSIONING.md: weekly
# 1.x releases sized by what merged, 2.0 pre-releases on next, an urgent fix, the cutover and the
# patches of the older line.
set -euo pipefail

script="$(cd "$(dirname "$0")" && pwd)/next-version.sh"
repo=$(mktemp -d)
trap 'rm -rf "$repo"' EXIT
cd "$repo"

git init -q -b main
git config user.name test
git config user.email test@example.com
git config commit.gpgsign false
git config tag.gpgsign false

failures=0
commits=0

# commit <subject> [dir]: a commit adding its own file under dir (default client), so syncing
# main into next never conflicts
commit() {
  commits=$((commits + 1))
  mkdir -p "${2:-client}"
  echo "$commits" >"${2:-client}/file-$commits"
  git add -A
  git commit -qm "$1"
}

major() {
  echo "$1" >.release-major
  git add -A
  git commit -qm "chore: start $1.x"
}

# expect <ref> <expected output, `;`-separated> [env...]: runs the script on the current HEAD
expect() {
  local ref=$1 want=$2 got
  shift 2
  got=$(env RELEASE_REF="$ref" "$@" "$script" 2>/dev/null | paste -sd ';') || got="error"
  if [ "$got" = "$want" ]; then
    echo "ok   $ref $* -> $want"
  else
    echo "FAIL $ref $* -> got '$got', want '$want'"
    failures=$((failures + 1))
  fi
}

# out <bump> <tag> <latest> <previous>: the expected output of a release
out() {
  local prerelease=false
  [[ "$2" == *-* ]] && prerelease=true
  echo "release=true;bump=$1;version=${2#v};tag=$2;prerelease=$prerelease;latest=$3;previous=$4"
}

# release <ref> [env...]: tags what the script returns, as release.yaml does
release() {
  local ref=$1 tag
  shift
  tag=$(env RELEASE_REF="$ref" "$@" "$script" | sed -n 's/^tag=//p')
  git tag -a "$tag" -m "$tag"
}

# The 0.x history stays; setting the major releases its first version
major 0
commit "feat: first screen"
git tag -a v0.4.0 -m v0.4.0
expect main "release=false"
major 1
expect main "$(out major v1.0.0 true v0.4.0)"
release main

# Weeks with nothing that ships release nothing, whoever merged it
commit "ci(deps): bump actions/checkout from 6 to 7" .github
commit "chore(deps): bump @docusaurus/core" website
commit "ci(deps): bump Pulp plugin versions to latest releases" e2e-pins
commit "docs: explain labels" docs
commit "docs: fix a comment" client
commit "test: cover the task list" client
commit "chore: tidy the lint config" client
commit "chore(deps-dev): bump eslint from 9.1.0 to 9.2.0" client
expect main "release=false"

# Dependabot runtime updates alone: a patch
commit "chore(deps): bump react from 19.1.0 to 19.1.1" client
expect main "$(out patch v1.0.1 true v1.0.0)"
release main
commit "fix: keep the filter on reload"
commit "Revert \"fix: keep the filter on reload\""
expect main "$(out patch v1.0.2 true v1.0.1)"
release main

# A feat among bot PRs: a minor; a breaking feat too (the major moves only with .release-major)
commit "chore(deps): bump axios" server
commit "feat(repositories): show the sync status"
expect main "$(out minor v1.1.0 true v1.0.2)"
release main
commit "feat(ui)!: new navigation"
expect main "$(out minor v1.2.0 true v1.1.0)"
release main

# next starts from main: its first alpha comes with its major
git switch -qc next
expect next "release=false"
major 2
expect next "$(out prerelease v2.0.0-alpha.1 false v1.2.0)"
release next
commit "feat(ssr): server entry"
expect next "$(out prerelease v2.0.0-alpha.2 false v2.0.0-alpha.1)"
release next
commit "docs(ai): describe the assistant" docs
expect next "release=false"

# A fix on main is synced into next: both release it
git switch -q main
commit "fix: task list paging"
expect main "$(out patch v1.2.1 true v1.2.0)"
release main
git switch -q next
git merge -q --no-edit main
expect next "$(out prerelease v2.0.0-alpha.3 false v2.0.0-alpha.2)"
release next
# Commits already released, brought in again by a sync, don't count twice
git switch -q main
commit "ci: cache playwright" .github
git switch -q next
git merge -q --no-edit main
expect next "release=false"

# The alphas don't move main's numbering
git switch -q main
commit "feat: dashboard cards"
expect main "$(out minor v1.3.0 true v1.2.1)"
release main

# Urgent fix while main holds an unreleased feat: release-1.3 from v1.3.0 takes the fix alone
commit "feat: half-done wizard"
git branch release-1.3 v1.3.0
git switch -q release-1.3
commit "docs: note" docs
expect release-1.3 "release=false"
commit "fix: crash on empty domain"
expect release-1.3 "$(out patch v1.3.1 true v1.3.0)"
release release-1.3
git switch -q main
commit "fix: crash on empty domain"
expect main "$(out minor v1.4.0 true v1.3.0)"
release main
# Only fixes on main, but release-1.4 owns the 1.4.Z patches: main moves to 1.5.0
git branch release-1.4 v1.4.0
commit "fix: typo in a label"
expect main "$(out minor v1.5.0 true v1.4.0)"
release main
# A patch of an older line is never Latest, and a backported feat is still a patch
git switch -q release-1.3
commit "fix: another crash"
expect release-1.3 "$(out patch v1.3.2 false v1.3.1)"
commit "feat: small backported option"
expect release-1.3 "$(out patch v1.3.2 false v1.3.1)"

# Channels on next: beta then rc; going back to an earlier channel is refused
git switch -q next
git merge -q --no-edit main
expect next "$(out prerelease v2.0.0-beta.1 false v2.0.0-alpha.3)" RELEASE_CHANNEL=beta
release next RELEASE_CHANNEL=beta
commit "feat(ai): explain a failed task"
expect next "error" RELEASE_CHANNEL=alpha
expect next "error" RELEASE_CHANNEL=gamma
expect next "$(out prerelease v2.0.0-rc.1 false v2.0.0-beta.1)" RELEASE_CHANNEL=rc
release next RELEASE_CHANNEL=rc

# Cutover: next lands on main and 2.0.0 is released explicitly; then fixes and features as usual
git switch -q main
git merge -q --no-edit next
expect main "$(out explicit v2.0.0 true v1.5.0)" RELEASE_VERSION=v2.0.0
expect main "error" RELEASE_VERSION=2.0.0
release main RELEASE_VERSION=v2.0.0
expect main "error" RELEASE_VERSION=v2.0.0
expect main "release=false"
commit "fix: after the cutover"
expect main "$(out patch v2.0.1 true v2.0.0)"
release main
commit "feat: after the cutover"
expect main "$(out minor v2.1.0 true v2.0.1)"
release main

# next once 2.0.0 is out: its major must move to 3
git switch -q next
commit "feat(ai): more"
expect next "error"

# Branches outside the model
git switch -qc feature/x
commit "feat: x"
expect feature/x "error"

if [ "$failures" -gt 0 ]; then
  echo "$failures failed"
  exit 1
fi
echo "all passed"

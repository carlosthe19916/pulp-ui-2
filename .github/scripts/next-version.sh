#!/usr/bin/env bash
# Prints the next release of the checked-out branch as key=value lines (append them to
# $GITHUB_OUTPUT). See VERSIONING.md.
#
# Only unreleased commits that change what ships (SHIPPED_PATHS) count, and their Conventional
# Commit type sizes the release: a feat raises the minor; fix, perf, refactor, revert, build and
# chore(deps) raise the patch; anything else (docs, test, ci, chore(deps-dev), other chores)
# releases nothing.
#
#   main          minor: vMAJOR.(Y+1).0; patch: vMAJOR.Y.(Z+1); the first of a major vMAJOR.0.0.
#                 A patch becomes a minor once release-MAJOR.Y exists, which owns the Y.Z patches.
#   next          vMAJOR.0.0-<channel>.(N + 1), channel alpha | beta | rc
#   release-X.Y   vX.Y.(Z + 1)
#
# MAJOR is read from .release-major. Env: RELEASE_REF (branch, required), RELEASE_CHANNEL
# (default alpha), RELEASE_VERSION (explicit vX.Y.Z[-channel.N]; releases whatever changed).
# Outputs: release (false when nothing releasable is new), bump (major | minor | patch |
# prerelease | explicit), version, tag, prerelease, latest, previous (the release the notes start
# from: the highest lower version this branch contains, stable for a stable release).
set -euo pipefail

ref=${RELEASE_REF:?RELEASE_REF is required}
channel=${RELEASE_CHANNEL:-alpha}
override=${RELEASE_VERSION:-}

# What goes into the container image (Dockerfile, .dockerignore), plus the major it is versioned
# with. Website, docs, e2e, CI and the e2e backend pins (plugin-versions.txt) don't ship.
SHIPPED_PATHS=(client common server branding package.json package-lock.json Dockerfile
  entrypoint.sh .release-major)

stable_re='^v[0-9]+\.[0-9]+\.[0-9]+$'
any_re='^v[0-9]+\.[0-9]+\.[0-9]+(-(alpha|beta|rc)\.[0-9]+)?$'

fail() {
  echo "::error::$1" >&2
  exit 1
}

tags=$(git tag --list 'v*' | grep -E "$any_re" || true)
stable_tags=$(grep -E "$stable_re" <<<"$tags" || true)

# highest <tags> <prefix>: the highest number right after <prefix> among the tags, or -1
highest() {
  awk -v p="$2" 'index($0, p) == 1 {
    split(substr($0, length(p) + 1), a, /[.-]/)
    if (a[1] ~ /^[0-9]+$/ && (!found || a[1] + 0 > max)) { max = a[1] + 0; found = 1 }
  } END { print found ? max : -1 }' <<<"$1"
}

read_major() {
  [ -f .release-major ] || fail ".release-major is missing"
  local major
  major=$(tr -cd '0-9' <.release-major)
  [ -n "$major" ] || fail ".release-major must contain the major version number"
  echo "$major"
}

# level <subject>: the bump a commit subject asks for: minor, patch or none
level() {
  local re='^([a-z]+)(\(([^)]*)\))?!?: '
  if [[ "$1" =~ ^Revert\  ]]; then
    echo patch
  elif [[ "$1" =~ $re ]]; then
    case "${BASH_REMATCH[1]}" in
    feat) echo minor ;;
    fix | perf | refactor | revert | build) echo patch ;;
    # Runtime dependencies ship; deps-dev (build and test tools) don't
    chore) if [ "${BASH_REMATCH[3]}" = deps ]; then echo patch; else echo none; fi ;;
    *) echo none ;;
    esac
  else
    echo none
  fi
}

# has_branch <name>: the branch exists locally or on origin
has_branch() {
  git show-ref --verify --quiet "refs/heads/$1" || git show-ref --verify --quiet "refs/remotes/origin/$1"
}

if [ -n "$override" ]; then
  [[ "$override" =~ $any_re ]] || fail "$override is not vX.Y.Z or vX.Y.Z-alpha.N, -beta.N, -rc.N"
  tag=$override
  bump=explicit
else
  # Unreleased: in no release of this branch's line. next contains main's releases too (the
  # sync), but they didn't ship to next's users; with no release of its own yet, all count.
  released=$(git tag --merged HEAD --list 'v*' | grep -E "$any_re" || true)
  case "$ref" in
  next) own=$(grep -F -- "v$(read_major).0.0-" <<<"$released" || true) ;;
  release-*) own=$(grep -F -- "v${ref#release-}." <<<"$released" || true) ;;
  *) own="" ;;
  esac
  if [ -n "$own" ]; then released=$own; fi
  # shellcheck disable=SC2086 # one --not argument per tag
  subjects=$(git log --no-merges --format=%s HEAD --not $released -- "${SHIPPED_PATHS[@]}")
  wanted=none
  while IFS= read -r subject; do
    [ -n "$subject" ] || continue
    case "$(level "$subject")" in
    minor) wanted=minor ;;
    patch) if [ "$wanted" = none ]; then wanted="patch"; fi ;;
    esac
  done <<<"$subjects"
  # A new major in .release-major is a release whatever its commit type
  # shellcheck disable=SC2086
  if [ "$wanted" = none ] && [ -n "$(git log --no-merges --format=%h HEAD --not $released -- .release-major)" ]; then
    wanted="patch"
  fi
  if [ "$wanted" = none ]; then
    echo "::notice::$ref has nothing to release: no unreleased feat, fix or dependency update changes what ships" >&2
    echo "release=false"
    exit 0
  fi

  case "$ref" in
  main)
    major=$(read_major)
    minor=$(highest "$stable_tags" "v$major.")
    if [ "$minor" -lt 0 ]; then
      bump=major
      tag="v$major.0.0"
    elif [ "$wanted" = patch ] && ! has_branch "release-$major.$minor"; then
      bump="patch"
      tag="v$major.$minor.$(($(highest "$stable_tags" "v$major.$minor.") + 1))"
    else
      bump=minor
      tag="v$major.$((minor + 1)).0"
    fi
    ;;
  next)
    major=$(read_major)
    base="v$major.0.0"
    if grep -qxF "$base" <<<"$tags"; then
      fail "$base is released: set the next major in next's .release-major"
    fi
    case "$channel" in
    alpha) later="beta rc" ;;
    beta) later="rc" ;;
    rc) later="" ;;
    *) fail "channel must be alpha, beta or rc, not $channel" ;;
    esac
    for c in $later; do
      if grep -qF -- "$base-$c." <<<"$tags"; then
        fail "$base has $c releases: $channel would sort before them"
      fi
    done
    n=$(($(highest "$tags" "$base-$channel.") + 1))
    if [ "$n" -lt 1 ]; then n=1; fi
    bump=prerelease
    tag="$base-$channel.$n"
    ;;
  release-[0-9]*.[0-9]*)
    line=${ref#release-}
    [[ "$line" =~ ^[0-9]+\.[0-9]+$ ]] || fail "$ref is not release-X.Y"
    # A backported feat is still a patch here
    bump="patch"
    tag="v$line.$(($(highest "$stable_tags" "v$line.") + 1))"
    ;;
  *) fail "$ref is not main, next or release-X.Y" ;;
  esac
fi

if grep -qxF "$tag" <<<"$tags"; then fail "$tag already exists"; fi

if [[ "$tag" == *-* ]]; then
  prerelease=true
  latest=false
else
  prerelease=false
  # Latest only when it is the highest stable version (not a patch of an older line)
  top=$(printf '%s\n' "$stable_tags" "$tag" | sort -V | tail -1)
  if [ "$top" = "$tag" ]; then latest=true; else latest=false; fi
fi

# Lower versions in this branch's history (a release-X.Y patch follows X.Y.Z-1, not a newer line)
lower=$(git tag --merged HEAD --list 'v*' | grep -E "$any_re" || true)
if [ "$prerelease" = false ]; then lower=$(grep -E "$stable_re" <<<"$lower" || true); fi
previous=$(printf '%s\n' "$lower" "$tag" | sort -V | sed "/^${tag//./\\.}\$/q" | sed '$d' | tail -1)

echo "release=true"
echo "bump=$bump"
echo "version=${tag#v}"
echo "tag=$tag"
echo "prerelease=$prerelease"
echo "latest=$latest"
echo "previous=$previous"

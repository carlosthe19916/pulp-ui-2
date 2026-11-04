#!/usr/bin/env bash
# Runs the client side of the RubyGems tutorial against Pulp: build hello_pulp, upload and publish
# it in gems-hosted, then bundle hello-app with rainbow from the cache and hello_pulp from Pulp.
# Run ./setup.sh first. Requires Ruby 3 with Bundler.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

VERSION="${VERSION:-1.0.0}"
export GEM_PROXY_URL="${CONTENT_URL}/rubygems-proxy/"
export GEM_HOSTED_URL="${CONTENT_URL}/gems-hosted/"

# Throwaway gem and bundle directories, so every gem really comes from Pulp.
WORK="$PWD/.gem-demo"
rm -rf "$WORK" build && mkdir -p "$WORK" build
export GEM_HOME="$WORK/gems" BUNDLE_PATH="$WORK/bundle" BUNDLE_USER_HOME="$WORK/bundler"
export BUNDLE_GEMFILE="$PWD/hello-app/Gemfile" BUNDLE_LOCKFILE="$WORK/Gemfile.lock"

step "Install rainbow through the cache: gem install --source ${GEM_PROXY_URL}"
gem install --clear-sources --source "$GEM_PROXY_URL" --no-document rainbow -v '~> 3.1'

step "Build hello_pulp ${VERSION}, upload it to gems-hosted and publish (gem push isn't supported)"
(cd hello-lib && HELLO_PULP_VERSION="$VERSION" gem build -q hello_pulp.gemspec -o "../build/hello_pulp-${VERSION}.gem")
hosted="$(lookup repositories/gem/gem gems-hosted)"
if curl -sSf "${GEM_HOSTED_URL}info/hello_pulp" 2>/dev/null | grep -q "^${VERSION} "; then
  echo "hello_pulp ${VERSION} is already in gems-hosted, skipping the upload"
else
  pulp_upload content/gem/gem "build/hello_pulp-${VERSION}.gem" -F "repository=${hosted}"
  pulp_publish publications/gem/gem "$hosted"
fi

step "Bundle and run hello-app"
bundle install --quiet
ruby hello-app/app.rb

step "Done. Open Pulp UI: Content Management > Repositories > gems-hosted"

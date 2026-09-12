#!/bin/sh
set -eu

SERVER_URL="${SERVER_URL:-http://pulp-ui-2-keycloak:8080}"
TIMEOUT="${TIMEOUT:-120}"

attempt_counter=0
interval=3
max_attempts=$((TIMEOUT / interval))

echo "Waiting for ${SERVER_URL}"
until curl --output /dev/null --silent --head --fail "${SERVER_URL}"; do
  if [ "${attempt_counter}" -eq "${max_attempts}" ]; then
    echo "Max attempts reached"
    exit 1
  fi

  printf '.'
  attempt_counter=$((attempt_counter + 1))
  sleep "${interval}"
done

echo "Server ready to listen"

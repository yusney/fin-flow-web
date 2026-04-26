#!/bin/sh
set -e

if [ -n "$API_URL" ]; then
  echo "Injecting API_URL=$API_URL into config.json"
  printf '{\n  "apiUrl": "%s"\n}' "$API_URL" > /usr/share/nginx/html/config.json
else
  echo "Using default config.json"
fi

# Do NOT exec nginx here — the Dockerfile CMD handles that.
# Scripts in /docker-entrypoint.d/ are sourced by the nginx entrypoint,
# which then proceeds to the CMD.
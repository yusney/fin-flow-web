#!/bin/sh
set -e

if [ -n "$API_URL" ]; then
  echo "Injecting API_URL=$API_URL into config.json"
  printf '{\n  "apiUrl": "%s"\n}' "$API_URL" > /usr/share/nginx/html/config.json
else
  echo "Using default config.json"
fi

exec nginx -g 'daemon off;'
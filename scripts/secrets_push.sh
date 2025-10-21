#!/usr/bin/env bash
# Usage: ./secrets_push.sh secrets.json.gpg
# Decrypts the given GPG-encrypted JSON file (containing env vars) and pushes keys to Supabase function secrets using supabase CLI.
# Requires: gpg, supabase CLI, and you to be logged into supabase CLI.

set -euo pipefail

if [[ -z "${1-}" ]]; then
  echo "Usage: $0 <secrets.json.gpg>"
  exit 2
fi

GPG_FILE="$1"
TMP_JSON="/tmp/supabase_secrets_$$.json"

trap 'rm -f "$TMP_JSON"' EXIT

# Decrypt
if ! gpg --batch --yes --output "$TMP_JSON" --decrypt "$GPG_FILE"; then
  echo "Failed to decrypt $GPG_FILE"
  exit 3
fi

# Read JSON and export keys via supabase CLI (requires supabase CLI installed and logged in)
# JSON format: {"KEY": "value", "KEY2": "value2"}

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found. Install from https://github.com/supabase/cli"
  exit 4
fi

keys=$(jq -r 'keys[]' "$TMP_JSON")
for k in $keys; do
  v=$(jq -r --arg K "$k" '.[$K]' "$TMP_JSON")
  echo "Setting secret $k"
  supabase secrets set "$k=$v" || { echo "Failed to set $k"; exit 5; }
done

echo "All secrets pushed to Supabase."

#!/usr/bin/env bash
# Helper script to push secrets and deploy Supabase functions
# Usage: ./scripts/deploy_functions.sh

set -euo pipefail

REQUIRED=(SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY)
for v in "${REQUIRED[@]}"; do
  if [[ -z "${!v:-}" ]]; then
    echo "Missing required env: $v"
    exit 1
  fi
done

# Confirm
read -p "This will deploy Supabase functions and may touch live secrets. Continue? (y/N) " yn
if [[ "${yn,,}" != "y" ]]; then
  echo "Aborting."
  exit 0
fi

# Push secrets (if using scripts/secrets_push.sh, user must configure secrets.gpg)
if [[ -f scripts/secrets_push.sh ]]; then
  echo "Running scripts/secrets_push.sh to push secrets (if present)..."
  bash scripts/secrets_push.sh || echo "secrets_push.sh failed or skipped"
fi

# Deploy known functions
FUNCTIONS=(deploy-contract arbitrage-engine executor)
for fn in "${FUNCTIONS[@]}"; do
  echo "Deploying supabase function: $fn"
  supabase functions deploy "$fn" || { echo "Failed to deploy $fn"; exit 1; }
done

echo "Deployment complete. Remember to verify environment variables in Supabase and keep PRIVATE_KEY out of source control."

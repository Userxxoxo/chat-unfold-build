RUNBOOK: Deploy Supabase functions and push secrets

This file documents the minimal, safe steps to push secrets, deploy the Supabase functions in this repo, and run the integration smoke test.

Prerequisites
- You (or CI) have a Supabase account and permissions on the target project.
- supabase CLI installed and logged in on the machine used for deploy.
- gpg and jq installed locally.
- A secure location to store the encrypted secrets file (do NOT commit unencrypted secrets).

1) Install and verify the Supabase CLI (pick one)

Homebrew (recommended macOS / Linuxbrew):
```bash
brew tap supabase/cli
brew install supabase/tap/supabase
supabase --version
supabase login
```

npm (alternative):
```bash
npm install -g supabase
supabase --version
supabase login
```

Prebuilt binary (alternative):
- Download from https://github.com/supabase/cli/releases, unpack, move `supabase` into a PATH folder and verify with `supabase --version`.

2) Prepare secrets (locally)
- Edit `scripts/secrets_template.json` and replace placeholders with real values.
  - Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PRIVATE_KEY, BASE_RPC_URL, BASESCAN_API_KEY
  - Optional: DEX_ROUTERS, TOKEN_PAIRS, TOKEN_ADDRESSES, ENABLE_LIVE_EXECUTION, etc.

- Create an encrypted copy (symmetric example):
```bash
gpg --symmetric --cipher-algo AES256 --output ./scripts/secrets.json.gpg ./scripts/secrets_template.json
```
Or encrypt to a recipient key:
```bash
gpg --encrypt --recipient your-email@example.com --output ./scripts/secrets.json.gpg ./scripts/secrets_template.json
```

3) Push secrets to Supabase (safe, per-key)
```bash
# requires supabase CLI installed & logged in
bash scripts/secrets_push.sh ./scripts/secrets.json.gpg
```
This script decrypts the file locally and runs `supabase secrets set "KEY=value"` for each key. The helper removes the temporary file after use.

4) Deploy functions
```bash
# helper deploy (deploys known functions)
bash scripts/deploy_functions.sh
# or deploy individually
supabase functions deploy deploy-contract
supabase functions deploy arbitrage-engine
supabase functions deploy executor
```

5) Verify post-deploy
- Confirm function deployment via `supabase functions list` or the Supabase dashboard.
- Confirm environment variables (Secrets) are visible in the Supabase Project Settings -> Secrets (they are hidden values).

6) Run integration/smoke tests (local)
- Create `.env` with minimal vars:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
- Install test deps and run the Node smoke test:
```bash
npm install node-fetch@2 dotenv
node tests/integration/integration_supabase_test.js
```

7) Optional: Verify contract source on BaseScan
- The `deploy-contract` function submits verification to BaseScan. You can confirm via the BaseScan website or by polling the BaseScan verification status endpoint.

Safety checklist before enabling live execution
- Keep PRIVATE_KEY out of source control. Rotate keys if accidentally exposed.
- Prefer multisig or HSM for production signing (this repo supports local signing for testing and simple deployments).
- Set `ENABLE_LIVE_EXECUTION=false` until you have monitored live scans and are confident of guardrail settings.
- Confirm `MAX_GAS_LIMIT`, `MAX_SLIPPAGE_PERCENT`, and `EXECUTOR_KILL_SWITCH` are set appropriately.
- Monitor function logs and add alerting for failed transactions or unusual volumes.

Troubleshooting
- If `supabase` command is not found, ensure installed binary is in PATH.
- If `supabase login` fails in headless environments, use CI-friendly access tokens and `supabase functions deploy --project-ref <ref> --access-token $SUPABASE_ACCESS_TOKEN`.

Final notes
- After successful deploy and test, you can enable live execution (flip `ENABLE_LIVE_EXECUTION=true`) and unpause the executor; however, I strongly recommend a staged rollout and close monitoring.

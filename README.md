# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/575ea9bf-3be4-4cf7-ad7c-1567544b658c

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/575ea9bf-3be4-4cf7-ad7c-1567544b658c) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/575ea9bf-3be4-4cf7-ad7c-1567544b658c) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Mainnet (Base) deployment

This project includes serverless functions that can deploy smart contracts and execute trades. The repository can be configured to run against Base mainnet and submit verification requests to BaseScan.

Important environment variables (see `.env.example`):

- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key for server-side operations
- `PRIVATE_KEY` — deployer wallet private key (DO NOT COMMIT; use secure secret storage)
- `BASE_RPC_URL` — RPC endpoint for Base mainnet (e.g. `https://rpc.base.org`)
- `BASESCAN_API_KEY` — API key for BaseScan contract verification

Safety and operational checklist before enabling mainnet deploys:

- Never store raw private keys in source control. Use Supabase secrets or a hardware signer / multisig in production.
- Test thoroughly on a Base testnet or other public testnet before switching to mainnet.
- Add monitoring, rate limits, and kill-switches for live execution.
- Ensure proper legal and compliance review for automated trading strategies in your jurisdiction.

The deploy function will save deployment metadata to the `deployed_contracts` table and attempt BaseScan verification if `BASESCAN_API_KEY` is present.

Scanner configuration
---------------------

To enable the on-chain scanner that samples router quotes, set the following environment variables for Supabase functions (as JSON strings):

- `DEX_ROUTERS` — JSON object mapping router names to contract addresses (e.g. `{"UniswapV2":"0x...","SushiSwap":"0x..."}`)
- `TOKEN_PAIRS` — JSON array of token pair strings to scan (e.g. `["WETH/USDC","WETH/DAI"]`)
- `TOKEN_ADDRESSES` — JSON object mapping token symbols to addresses (e.g. `{"WETH":"0x...","USDC":"0x..."}`)
- `PROFIT_THRESHOLD_PERCENT` — optional float, minimum spread percent to report (default `0.5`)

The scanner uses `getAmountsOut` on configured routers to sample quotes for a 1-token unit and reports pairs where the best-sell vs best-buy spread exceeds the profit threshold. This is a basic scanner — for production, extend it with:

- dynamic sample sizes, liquidity checks, slippage & gas estimation
- subgraph integrations and order book/depth analysis
- rate-limiting, monitoring and a secure execution path to avoid frontrunning

Executor and secrets helper
---------------------------

I added a simple executor function at `supabase/functions/executor/index.ts`. It will:

- run the on-chain scanner, persist candidate opportunities to `arbitrage_candidates`,
- if `ENABLE_LIVE_EXECUTION=true` and `DEPLOYED_CONTRACT_ADDRESS` is set, attempt to execute the top opportunity via the deployed contract and record the transaction.

To avoid accidental live runs, the executor requires `ENABLE_LIVE_EXECUTION=true` explicitly set in Supabase function secrets.

To help manage secrets from your filesystem, there's a helper script `scripts/secrets_push.sh` that decrypts a GPG-encrypted JSON file and pushes each key as a Supabase secret. Usage:

```bash
# Decrypt & push secrets.json.gpg (you create this encrypted file locally with your real secrets)
./scripts/secrets_push.sh /path/to/secrets.json.gpg
```

The `secrets.json` should be a JSON map of keys to values, for example:

```json
{
	"SUPABASE_URL": "https://your.supabase.co",
	"SUPABASE_SERVICE_ROLE_KEY": "...",
	"PRIVATE_KEY": "0x...",
	"BASE_RPC_URL": "https://rpc.base.org",
	"BASESCAN_API_KEY": "...",
	"DEX_ROUTERS": "{\"UniswapV2\":\"0x...\"}",
	"TOKEN_PAIRS": "[\"WETH/USDC\"]",
	"TOKEN_ADDRESSES": "{\"WETH\":\"0x...\",\"USDC\":\"0x...\"}",
	"PROFIT_THRESHOLD_PERCENT": "0.5",
	"ENABLE_LIVE_EXECUTION": "false",
	"DEPLOYED_CONTRACT_ADDRESS": "0x..."
}
```

Important: Do not commit the decrypted JSON to disk or git. Keep it encrypted and only decrypt locally when running `secrets_push.sh`.

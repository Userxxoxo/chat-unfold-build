import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6'

declare const Deno: {
  env: { get(key: string): string | undefined }
  serve(handler: (req: Request) => Promise<Response> | Response): void
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Minimal router ABI
const ROUTER_ABI = [
  'function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[])'
]

async function getOnchainAmountOut(provider: ethers.JsonRpcProvider, routerAddress: string, tokenIn: string, tokenOut: string, amountIn: bigint) {
  const router = new ethers.Contract(routerAddress, ROUTER_ABI, provider)
  const path = [tokenIn, tokenOut]
  const amounts = await router.getAmountsOut(amountIn, path)
  return amounts[amounts.length - 1]
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'POST, OPTIONS' } })

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    const privateKey = Deno.env.get('PRIVATE_KEY')
    const baseRpcUrl = Deno.env.get('BASE_RPC_URL')
    const enableLive = (Deno.env.get('ENABLE_LIVE_EXECUTION') ?? 'false') === 'true'

    if (!privateKey) throw new Error('PRIVATE_KEY not configured')
    if (!baseRpcUrl) throw new Error('BASE_RPC_URL not configured')

  const provider = new ethers.JsonRpcProvider(baseRpcUrl)
  const wallet = new ethers.Wallet(privateKey, provider)
  const remoteSignerUrl = Deno.env.get('REMOTE_SIGNER_URL')
  const secretConfirmation = Deno.env.get('SECRET_CONFIRMATION')

  // Guardrails
  const maxGasLimit = BigInt(Deno.env.get('MAX_GAS_LIMIT') ?? '2000000')
  const maxSlippagePercent = Number(Deno.env.get('MAX_SLIPPAGE_PERCENT') ?? '2')
  const killSwitch = (Deno.env.get('EXECUTOR_KILL_SWITCH') ?? 'false') === 'true'
  if (killSwitch) throw new Error('Executor kill-switch is enabled')

    // Read scanner config
    const dexRouters = JSON.parse(Deno.env.get('DEX_ROUTERS') ?? '{}')
    const tokenPairs = JSON.parse(Deno.env.get('TOKEN_PAIRS') ?? '[]')
    const tokenAddresses = JSON.parse(Deno.env.get('TOKEN_ADDRESSES') ?? '{}')
    const profitThreshold = Number(Deno.env.get('PROFIT_THRESHOLD_PERCENT') ?? '0.5')

    interface Candidate {
      pair: string
      buy: { name: string; out: bigint; addr: string }
      sell: { name: string; out: bigint; addr: string }
      profitPercent: number
    }

    const opportunities: Candidate[] = []

    for (const pair of tokenPairs) {
      const [tA, tB] = pair.split('/')
      const addrA = tokenAddresses[tA] || tA
      const addrB = tokenAddresses[tB] || tB
      const sampleAmount = ethers.parseUnits('1', 18)

      const quotes: Array<{ name: string; out: bigint; addr: string }> = []
      for (const [name, routerAddr] of Object.entries(dexRouters)) {
        try {
          const out = await getOnchainAmountOut(provider, routerAddr as string, addrA, addrB, sampleAmount)
          quotes.push({ name, out, addr: routerAddr as string })
        } catch (err) {
          // ignore
        }
      }

      if (quotes.length < 2) continue
      quotes.sort((a, b) => Number(a.out) - Number(b.out))
      const bestBuy = quotes[0]
      const bestSell = quotes[quotes.length - 1]
      const profitPercent = (Number(bestSell.out) / Number(bestBuy.out) - 1) * 100
      if (profitPercent > profitThreshold) {
        opportunities.push({ pair, buy: bestBuy, sell: bestSell, profitPercent })
      }
    }

    if (opportunities.length === 0) {
      return new Response(JSON.stringify({ opportunities: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Sort by profit and pick top
    opportunities.sort((a, b) => b.profitPercent - a.profitPercent)
    const top = opportunities[0]

    // Persist candidate opportunity
    try {
      await supabase.from('arbitrage_candidates').insert({
        token_pair: top.pair,
        buy_router: top.buy.name,
        buy_router_address: top.buy.addr,
        sell_router: top.sell.name,
        sell_router_address: top.sell.addr,
        profit_percent: top.profitPercent,
        detected_at: new Date().toISOString()
      })
    } catch (e) {
      // ignore DB errors but log for visibility
      console.warn('Failed to persist candidate opportunity:', e)
    }

    if (!enableLive) {
      return new Response(JSON.stringify({ opportunities, executed: false, reason: 'ENABLE_LIVE_EXECUTION=false' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Live execution path: requires DEPLOYED_CONTRACT_ADDRESS
    const deployedContract = Deno.env.get('DEPLOYED_CONTRACT_ADDRESS')
    if (!deployedContract) return new Response(JSON.stringify({ error: 'DEPLOYED_CONTRACT_ADDRESS required for live execution' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    // Build and send tx via the deployed contract's executeArbitrage (assumes same ABI as other function expects)
    const CONTRACT_ABI = [
      'function executeArbitrage(address asset, uint256 amount, address dexA, address dexB, bytes calldata params) external'
    ]
    const contract = new ethers.Contract(deployedContract, CONTRACT_ABI, wallet)

    // Simple params using addresses from top opportunity
    const assetAddr = tokenAddresses[top.pair.split('/')[0]] || top.pair.split('/')[0]
    const amount = ethers.parseEther('1') // small amount; in production calculate based on liquidity
    const params = ethers.AbiCoder.defaultAbiCoder().encode(['address','address','address','uint256'], [assetAddr, top.buy.addr, top.sell.addr, amount])

    // Simulation via callStatic (if the contract supports it) to avoid sending doomed txs
    try {
      await contract.callStatic.executeArbitrage(assetAddr, amount, top.buy.addr, top.sell.addr, params)
    } catch (simErr) {
      return new Response(JSON.stringify({ error: 'Simulation failed: ' + (simErr as Error).message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Estimate gas and enforce maxGasLimit
    const gasEstimate = await contract.executeArbitrage.estimateGas(assetAddr, amount, top.buy.addr, top.sell.addr, params)
    if (gasEstimate > maxGasLimit) {
      return new Response(JSON.stringify({ error: `Gas estimate ${gasEstimate.toString()} exceeds maxGasLimit` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const feeData = await provider.getFeeData()

    // Execute locally with wallet
    let receipt: ethers.TransactionReceipt | null = null
    let txHash: string | undefined
    const tx = await contract.executeArbitrage(assetAddr, amount, top.buy.addr, top.sell.addr, params, { gasLimit: gasEstimate * 130n / 100n, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas })
    txHash = tx.hash
    receipt = await tx.wait()

    // Store execution record
    try {
      await supabase.from('arbitrage_trades').insert({
        token_pair: top.pair,
        tx_hash: txHash ?? '',
        profit_percent: top.profitPercent,
        executed_at: new Date().toISOString(),
        status: 'executed'
      })
    } catch (e) {
      console.warn('Failed to store execution record:', e)
    }

    return new Response(JSON.stringify({ opportunities, executed: true, txHash: txHash ?? null, receipt }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Executor error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

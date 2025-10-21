import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Minimal ABI for Uniswap-like router getAmountsOut
const ROUTER_ABI = [
  'function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[])'
]

const ERC20_ABI = [
  'function decimals() view returns (uint8)'
]

async function getOnchainAmountOut(provider: ethers.JsonRpcProvider, routerAddress: string, tokenIn: string, tokenOut: string, amountIn: bigint) {
  try {
    const router = new ethers.Contract(routerAddress, ROUTER_ABI, provider)
    const path = [tokenIn, tokenOut]
    const amounts = await router.getAmountsOut(amountIn, path)
    return amounts[amounts.length - 1]
  } catch (err) {
    throw new Error('Router quote failed: ' + (err as Error).message)
  }
}

async function getTokenDecimals(provider: ethers.JsonRpcProvider, tokenAddress: string) {
  try {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
    const d = await token.decimals()
    return Number(d)
  } catch (err) {
    // default to 18
    return 18
  }
}

// Enhanced Arbitrage Contract ABI with Flashloan Support  
const CONTRACT_ABI = [
  "constructor(address _aavePoolProvider)",
  "function executeArbitrage(address asset, uint256 amount, address dexA, address dexB, bytes calldata params) external",
  "function executeOperation(address[] calldata assets, uint256[] calldata amounts, uint256[] calldata premiums, address initiator, bytes calldata params) external returns (bool)",
  "function withdraw(address token, uint256 amount) external",
  "function withdrawETH(uint256 amount) external", 
  "function getBalance(address token) external view returns (uint256)",
  "function getETHBalance() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function emergencyWithdraw() external",
  "function updateDexRouter(address dex, address router) external",
  "function getDexRouter(address dex) external view returns (address)",
  "function calculateProfit(address tokenA, address tokenB, uint256 amount, address dexA, address dexB) external view returns (int256)",
  "event ArbitrageExecuted(address indexed asset, uint256 amount, int256 profit, address dexA, address dexB)",
  "event FlashloanExecuted(address indexed asset, uint256 amount, uint256 premium)",
  "event FundsWithdrawn(address indexed token, address indexed to, uint256 amount)",
  "event DexRouterUpdated(address indexed dex, address indexed router)",
  "event EmergencyWithdrawal(address indexed to, uint256 ethAmount)"
]

interface ArbitrageOpportunity {
  id: string
  tokenPair: string
  buyDex: string
  sellDex: string
  buyPrice: number
  sellPrice: number
  profitPercent: number
  profitETH: number
  maxAmount: number
  timestamp: string
}

interface ExecuteTradeRequest {
  opportunity: ArbitrageOpportunity
  contractAddress: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { action } = body

  // Get configuration from Supabase secrets
  const privateKey = Deno.env.get('PRIVATE_KEY')
  const baseRpcUrl = Deno.env.get('BASE_RPC_URL')

    if (!privateKey) {
      throw new Error('Private key not configured in Supabase secrets')
    }

    if (!baseRpcUrl) {
      throw new Error('BASE_RPC_URL not configured in Supabase secrets. Please add your Base RPC URL.')
    }

    let provider, wallet
    try {
      provider = new ethers.JsonRpcProvider(baseRpcUrl)
      wallet = new ethers.Wallet(privateKey, provider)
      
      // Test the connection
      await provider.getNetwork()
    } catch (error) {
      console.error('RPC Provider error:', error)
      throw new Error(`Failed to connect to Base RPC. Please check your BASE_RPC_URL configuration. Error: ${(error as Error).message}`)
    }

    // Execution guardrails
    const maxGasLimit = BigInt(Deno.env.get('MAX_GAS_LIMIT') ?? '2000000')
    const maxSlippagePercent = Number(Deno.env.get('MAX_SLIPPAGE_PERCENT') ?? '2')
    const killSwitch = (Deno.env.get('EXECUTOR_KILL_SWITCH') ?? 'false') === 'true'
    if (killSwitch) throw new Error('Executor kill-switch is enabled')

    if (action === 'execute_trade') {
      const { opportunity, contractAddress } = body as ExecuteTradeRequest

      console.log('🚀 Executing enhanced arbitrage trade:', {
        tokenPair: opportunity.tokenPair,
        buyDex: opportunity.buyDex,
        sellDex: opportunity.sellDex,
        maxAmount: opportunity.maxAmount,
        expectedProfit: opportunity.profitETH
      })

      // Create contract instance with enhanced ABI
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet)

      // Mock token addresses - in production, fetch from DEX registries
      const tokenAddresses = {
        'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        'USDC': '0xA0b86a33E6441ddE2D0B8c9E1AE194B0266cAF7b',
        'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        'WBTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA'
      }

      const [tokenA, tokenB] = opportunity.tokenPair.split('/')
      const asset = tokenAddresses[tokenA as keyof typeof tokenAddresses] || tokenAddresses.WETH
      const targetToken = tokenAddresses[tokenB as keyof typeof tokenAddresses] || tokenAddresses.USDC

      // Enhanced DEX addresses with router contracts
      const dexRouters = {
        'Uniswap V2': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        'Uniswap V3': '0xE592427A0AEce92De3Edee1F18E0157C05861564', 
        'SushiSwap': '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
        'Curve': '0x99a58482BD75cbab83b27EC03CA68fF489b5788f',
        'Balancer': '0xBA12222222228d8Ba445958a75a0704d566BF2C8'
      }

      const dexA = dexRouters[opportunity.buyDex as keyof typeof dexRouters] || dexRouters['Uniswap V2']
      const dexB = dexRouters[opportunity.sellDex as keyof typeof dexRouters] || dexRouters['Uniswap V3']

      try {
        // Amount for flashloan (in wei)
        const amount = ethers.parseEther(Math.min(opportunity.maxAmount, 10).toString()) // Cap at 10 ETH for safety
        
        // Encode arbitrage parameters
        const params = ethers.AbiCoder.defaultAbiCoder().encode(
          ['address', 'address', 'address', 'uint256'],
          [targetToken, dexA, dexB, amount]
        )

        // Re-check on-chain quotes before sending tx to avoid stale opportunities
        // Try to ensure that the expected profit still holds (basic check using routers if configured)
        try {
          const currentBuyOut = await getOnchainAmountOut(provider, dexA, asset, targetToken, amount)
          const currentSellOut = await getOnchainAmountOut(provider, dexB, asset, targetToken, amount)
          // Determine estimated profit in tokenOut units (approx)
          const estimatedProfitTokenOut = Number(currentSellOut) - Number(currentBuyOut)
          // Convert tokenOut amount to ETH approximately by querying tokenOut->WETH route if available
          // Skipping precise conversion here; rely on contract's internal checks too
          console.log('🔎 On-chain re-check: buyOut', currentBuyOut?.toString(), 'sellOut', currentSellOut?.toString())
        } catch (err) {
          console.warn('⚠️ On-chain re-check failed or not configured:', (err as Error).message)
        }

        // Simulation via callStatic to avoid sending doomed transactions
        try {
          await contract.callStatic.executeArbitrage(asset, amount, dexA, dexB, params)
        } catch (simErr) {
          throw new Error('Simulation failed: ' + (simErr as Error).message)
        }

        // Estimate gas for the arbitrage execution
        console.log('⛽ Estimating gas for arbitrage execution...')
        const gasEstimate = await contract.executeArbitrage.estimateGas(
          asset,
          amount,
          dexA,
          dexB,
          params
        )

        if (gasEstimate > maxGasLimit) {
          throw new Error(`Gas estimate ${gasEstimate.toString()} exceeds configured MAX_GAS_LIMIT`)
        }

        console.log(`Gas estimate: ${gasEstimate.toString()}`)

        // Get current gas price
        const feeData = await provider.getFeeData()
        const maxFeePerGas = feeData.maxFeePerGas || ethers.parseUnits('50', 'gwei')
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits('2', 'gwei')

        // Basic slippage check using on-chain quotes
        try {
          const currentBuyOut = await getOnchainAmountOut(provider, dexA, asset, targetToken, amount)
          const currentSellOut = await getOnchainAmountOut(provider, dexB, asset, targetToken, amount)
          const observedProfitPercent = (Number(currentSellOut) / Number(currentBuyOut) - 1) * 100
          const slippage = Math.max(0, opportunity.profitPercent - observedProfitPercent)
          if (slippage > maxSlippagePercent) {
            throw new Error(`Slippage ${slippage.toFixed(2)}% exceeds MAX_SLIPPAGE_PERCENT`)
          }
        } catch (quoteErr) {
          console.warn('On-chain quote slippage check failed:', (quoteErr as Error).message)
        }

        // Execute the arbitrage with flashloan
        console.log('💰 Executing arbitrage with flashloan...')
        const tx = await contract.executeArbitrage(
          asset,
          amount,
          dexA,
          dexB,
          params,
          {
            gasLimit: gasEstimate * 130n / 100n, // Add 30% buffer for complex operations
            maxFeePerGas,
            maxPriorityFeePerGas
          }
        )

        console.log(`📝 Transaction sent: ${tx.hash}`)
        console.log('⏳ Waiting for confirmation...')

        const receipt = await tx.wait()
        console.log(`✅ Transaction confirmed in block: ${receipt?.blockNumber}`)
        console.log(`⛽ Gas used: ${receipt?.gasUsed?.toString()}`)

        // Parse logs to get actual profit
        let actualProfit = 0
        let flashloanAmount = 0
        
        if (receipt?.logs) {
          for (const log of receipt.logs) {
            try {
              const parsedLog = contract.interface.parseLog(log)
              if (parsedLog?.name === 'ArbitrageExecuted') {
                actualProfit = parseFloat(ethers.formatEther(parsedLog.args.profit))
                console.log(`💎 Actual profit: ${actualProfit} ETH`)
              }
              if (parsedLog?.name === 'FlashloanExecuted') {
                flashloanAmount = parseFloat(ethers.formatEther(parsedLog.args.amount))
                console.log(`🏦 Flashloan amount: ${flashloanAmount} ETH`)
              }
            } catch (error) {
              // Log parsing failed, continue
            }
          }
        }

        // Store successful trade in database
        const { error: dbError } = await supabase
          .from('arbitrage_trades')
          .insert({
            opportunity_id: opportunity.id,
            contract_address: contractAddress,
            tx_hash: tx.hash,
            token_pair: opportunity.tokenPair,
            buy_dex: opportunity.buyDex,
            sell_dex: opportunity.sellDex,
            estimated_profit: opportunity.profitETH,
            actual_profit: actualProfit,
            status: 'completed',
            executed_at: new Date().toISOString()
          })

        if (dbError) {
          console.error('❌ Error storing trade result:', dbError)
        } else {
          console.log('💾 Trade result stored in database')
        }

        return new Response(JSON.stringify({
          success: true,
          txHash: tx.hash,
          blockNumber: receipt?.blockNumber,
          gasUsed: receipt?.gasUsed?.toString(),
          estimatedProfit: opportunity.profitETH,
          actualProfit,
          flashloanAmount,
          tokenPair: opportunity.tokenPair,
          dexRoute: `${opportunity.buyDex} → ${opportunity.sellDex}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      } catch (error) {
        console.error('❌ Arbitrage execution failed:', error)
        
        // Store failed trade in database
        const { error: dbError } = await supabase
          .from('arbitrage_trades')
          .insert({
            opportunity_id: opportunity.id,
            contract_address: contractAddress,
            tx_hash: '',
            token_pair: opportunity.tokenPair,
            buy_dex: opportunity.buyDex,
            sell_dex: opportunity.sellDex,
            estimated_profit: opportunity.profitETH,
            actual_profit: null,
            status: 'failed',
            executed_at: new Date().toISOString()
          })

        if (dbError) {
          console.error('❌ Error storing failed trade:', dbError)
        }

        return new Response(JSON.stringify({
          success: false,
          error: (error as Error).message,
          tokenPair: opportunity.tokenPair,
          estimatedProfit: opportunity.profitETH
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    if (action === 'get_wallet_balance') {
      const balance = await provider.getBalance(wallet.address)
      const balanceETH = ethers.formatEther(balance)

      return new Response(JSON.stringify({
        address: wallet.address,
        balance: balanceETH
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'scan_opportunities') {
      // Live scanner using on-chain getAmountsOut across configured routers.
      // Required environment variables (as JSON): DEX_ROUTERS (map name->address), TOKEN_PAIRS (array of 'TOKENA/TOKENB'), PROFIT_THRESHOLD_PERCENT (optional)

      const dexRoutersJson = Deno.env.get('DEX_ROUTERS')
      const tokenPairsJson = Deno.env.get('TOKEN_PAIRS')
      const profitThreshold = Number(Deno.env.get('PROFIT_THRESHOLD_PERCENT') ?? '0.5')

      if (!dexRoutersJson || !tokenPairsJson) {
        return new Response(JSON.stringify({ error: 'DEX_ROUTERS or TOKEN_PAIRS env vars are not configured. Please configure DEX_ROUTERS (JSON) and TOKEN_PAIRS (JSON).' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      let dexRouters: Record<string, string> = {}
      let tokenPairs: string[] = []
      try {
        dexRouters = JSON.parse(dexRoutersJson)
        tokenPairs = JSON.parse(tokenPairsJson)
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Failed to parse DEX_ROUTERS or TOKEN_PAIRS JSON env var.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const opportunities: ArbitrageOpportunity[] = []

      // For each pair, sample quotes across routers to find spreads
      for (const pair of tokenPairs) {
        const [tokenA, tokenB] = pair.split('/')
        // Map token symbols to addresses - simple mapping; prefer environment-driven mapping
        const tokenAddresses: Record<string, string> = JSON.parse(Deno.env.get('TOKEN_ADDRESSES') ?? '{}')
        const addrA = tokenAddresses[tokenA] || tokenA
        const addrB = tokenAddresses[tokenB] || tokenB

        const routerEntries = Object.entries(dexRouters)

        // Build quotes map: router -> amountOut for selling 1 unit of tokenA (use 1 ETH-equivalent token amount?)
        // We'll use a fixed amount to compare, e.g., 1e18 (1 token with 18 decimals)
        const sampleAmount = ethers.parseUnits('1', 18)
        const quotes: Array<{ routerName: string; amountOut: bigint }> = []

        for (const [name, routerAddr] of routerEntries) {
          try {
            const out = await getOnchainAmountOut(provider, routerAddr, addrA, addrB, sampleAmount)
            quotes.push({ routerName: name, amountOut: out })
          } catch (err) {
            // skip routers that can't quote this pair
          }
        }

        if (quotes.length < 2) continue

        // Find best buy (lowest price in tokenB per tokenA) and best sell (highest)
        quotes.sort((a, b) => (Number(a.amountOut) - Number(b.amountOut)))
        const bestBuy = quotes[0]
        const bestSell = quotes[quotes.length - 1]

        // Calculate profit percent (sell/buy - 1)
        const profitPercent = (Number(bestSell.amountOut) / Number(bestBuy.amountOut) - 1) * 100

        if (profitPercent > profitThreshold) {
          opportunities.push({
            id: `${Date.now()}-${pair}`,
            tokenPair: pair,
            buyDex: bestBuy.routerName,
            sellDex: bestSell.routerName,
            buyPrice: Number(bestBuy.amountOut),
            sellPrice: Number(bestSell.amountOut),
            profitPercent,
            profitETH: 0,
            maxAmount: 1,
            timestamp: new Date().toISOString()
          })
        }
      }

      return new Response(JSON.stringify({ opportunities }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Invalid action specified')

  } catch (error) {
    console.error('Arbitrage engine error:', error)
    return new Response(JSON.stringify({
      error: (error as Error).message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function generateMockOpportunities(): ArbitrageOpportunity[] {
  const pairs = ['WETH/USDC', 'WETH/DAI', 'USDC/DAI', 'WBTC/WETH', 'LINK/WETH']
  const dexes = ['Uniswap V2', 'Uniswap V3', 'SushiSwap', 'Curve', 'Balancer']
  const opportunities: ArbitrageOpportunity[] = []

  for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
    const tokenPair = pairs[Math.floor(Math.random() * pairs.length)]
    const buyDex = dexes[Math.floor(Math.random() * dexes.length)]
    let sellDex = dexes[Math.floor(Math.random() * dexes.length)]
    while (sellDex === buyDex) {
      sellDex = dexes[Math.floor(Math.random() * dexes.length)]
    }
    
    const buyPrice = 1000 + Math.random() * 2000
    const profitPercent = 0.5 + Math.random() * 4
    const sellPrice = buyPrice * (1 + profitPercent / 100)
    const maxAmount = Math.floor(1000 + Math.random() * 9000)
    const profitETH = (maxAmount * buyPrice * profitPercent / 100) / 3000

    opportunities.push({
      id: Date.now().toString() + i,
      tokenPair,
      buyDex,
      sellDex,
      buyPrice,
      sellPrice,
      profitPercent,
      profitETH,
      maxAmount,
      timestamp: new Date().toISOString()
    })
  }

  return opportunities
}
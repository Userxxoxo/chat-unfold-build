import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const alchemyUrl = Deno.env.get('ALCHEMY_API_URL_MAINNET')

    if (!privateKey) {
      throw new Error('Private key not configured in Supabase secrets')
    }

    if (!alchemyUrl) {
      throw new Error('ALCHEMY_API_URL_MAINNET not configured in Supabase secrets. Please add your Alchemy API URL.')
    }

    let provider, wallet
    try {
      provider = new ethers.JsonRpcProvider(alchemyUrl)
      wallet = new ethers.Wallet(privateKey, provider)
      
      // Test the connection
      await provider.getNetwork()
    } catch (error) {
      console.error('RPC Provider error:', error)
      throw new Error(`Failed to connect to Ethereum network. Please check your ALCHEMY_API_URL_MAINNET configuration. Error: ${(error as Error).message}`)
    }

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

        // Estimate gas for the arbitrage execution
        console.log('⛽ Estimating gas for arbitrage execution...')
        const gasEstimate = await contract.executeArbitrage.estimateGas(
          asset,
          amount,
          dexA,
          dexB,
          params
        )

        console.log(`Gas estimate: ${gasEstimate.toString()}`)

        // Get current gas price
        const feeData = await provider.getFeeData()
        const maxFeePerGas = feeData.maxFeePerGas || ethers.parseUnits('50', 'gwei')
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits('2', 'gwei')

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
      // This would integrate with real DEX APIs to find actual opportunities
      // For now, return mock data with some randomization
      const opportunities = generateMockOpportunities()

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
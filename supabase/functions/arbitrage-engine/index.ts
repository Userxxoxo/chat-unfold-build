import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
      throw new Error(`Failed to connect to Ethereum network. Please check your ALCHEMY_API_URL_MAINNET configuration. Error: ${error.message}`)
    }

    if (action === 'execute_trade') {
      const { opportunity, contractAddress } = body as ExecuteTradeRequest

      // Contract ABI for interaction
      const contractABI = [
        "function executeArbitrage(address tokenA, address tokenB, address dexA, address dexB, uint256 amount) external payable returns (uint256)",
        "function getBalance() external view returns (uint256)",
        "event ArbitrageExecuted(address indexed tokenA, address indexed tokenB, uint256 profit)"
      ]

      const contract = new ethers.Contract(contractAddress, contractABI, wallet)

      console.log(`Executing arbitrage for ${opportunity.tokenPair}`)

      // Mock token addresses - in production, fetch from DEX APIs
      const tokenAddresses = {
        'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        'USDC': '0xA0b86a33E6441ddE2D0B8c9E1AE194B0266cAF7b',
        'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F'
      }

      const [tokenA, tokenB] = opportunity.tokenPair.split('/')
      const tokenAAddr = tokenAddresses[tokenA as keyof typeof tokenAddresses] || tokenAddresses.WETH
      const tokenBAddr = tokenAddresses[tokenB as keyof typeof tokenAddresses] || tokenAddresses.USDC

      // Mock DEX addresses
      const dexAddresses = {
        'Uniswap V2': '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
        'Uniswap V3': '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        'SushiSwap': '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac'
      }

      const dexAAddr = dexAddresses[opportunity.buyDex as keyof typeof dexAddresses] || dexAddresses['Uniswap V2']
      const dexBAddr = dexAddresses[opportunity.sellDex as keyof typeof dexAddresses] || dexAddresses['Uniswap V3']

      // Execute the arbitrage transaction
      const amountWei = ethers.parseEther(opportunity.maxAmount.toString())
      
      const gasLimit = await contract.executeArbitrage.estimateGas(
        tokenAAddr,
        tokenBAddr,
        dexAAddr,
        dexBAddr,
        amountWei,
        { value: ethers.parseEther("0.1") } // Some ETH for gas and potential profit
      )

      const tx = await contract.executeArbitrage(
        tokenAAddr,
        tokenBAddr,
        dexAAddr,
        dexBAddr,
        amountWei,
        { 
          value: ethers.parseEther("0.1"),
          gasLimit: gasLimit + 10000n // Add buffer
        }
      )

      console.log(`Transaction sent: ${tx.hash}`)
      const receipt = await tx.wait()
      console.log(`Transaction confirmed in block: ${receipt?.blockNumber}`)

      // Calculate actual profit
      const balanceAfter = await contract.getBalance()
      const profitWei = balanceAfter
      const profitETH = parseFloat(ethers.formatEther(profitWei))

      // Store the trade execution in database
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
          actual_profit: profitETH,
          executed_at: new Date().toISOString(),
          status: 'completed'
        })

      if (dbError) {
        console.error('Error storing trade:', dbError)
      }

      return new Response(JSON.stringify({
        success: true,
        txHash: tx.hash,
        blockNumber: receipt?.blockNumber,
        actualProfit: profitETH,
        estimatedProfit: opportunity.profitETH
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
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
      error: error.message
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
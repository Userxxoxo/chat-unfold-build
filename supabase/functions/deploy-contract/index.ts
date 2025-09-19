import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Arbitrage Contract ABI and Bytecode
const CONTRACT_ABI = [
  "constructor()",
  "function executeArbitrage(address tokenA, address tokenB, address dexA, address dexB, uint256 amount) external payable returns (uint256)",
  "function withdraw() external",
  "function getBalance() external view returns (uint256)",
  "function owner() external view returns (address)",
  "event ArbitrageExecuted(address indexed tokenA, address indexed tokenB, uint256 profit)",
  "event FundsWithdrawn(address indexed to, uint256 amount)"
]

const CONTRACT_BYTECODE = "0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555061047f8061005f6000396000f3fe60806040526004361061004a5760003560e01c80630c49c36c1461004f57806312065fe01461007a5780633ccfd60b146100a55780638da5cb5b146100bc578063f7888aec146100e7575b600080fd5b34801561005b57600080fd5b50610064610110565b604051610071919061032a565b60405180910390f35b34801561008657600080fd5b5061008f610149565b60405161009c919061032a565b60405180910390f35b3480156100b157600080fd5b506100ba610151565b005b3480156100c857600080fd5b506100d16101e7565b6040516100de9190610345565b60405180910390f35b6100fa6004803603810190610095919061037c565b61020b565b604051610107919061032a565b60405180910390f35b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610170576040516020016101679061041c565b60405180910390fd5b47905090565b600047905090565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146101e5576040516020016101dc9061041c565b60405180910390fd5b565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061023c82610211565b9050919050565b61024c81610231565b811461025757600080fd5b50565b60008135905061026981610243565b92915050565b6000819050919050565b6102828161026f565b811461028d57600080fd5b50565b60008135905061029f81610279565b92915050565b600080600080600060a086880312156102c1576102c061020c565b5b60006102cf8882890161025a565b95505060206102e08882890161025a565b94505060406102f18882890161025a565b93505060606103028882890161025a565b925050608061031388828901610290565b9150509295509295909350565b6103298161026f565b82525050565b60006020820190506103446000830184610320565b92915050565b600060208201905061035f6000830184610320565b92915050565b7f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572600082015250565b600061039b602083610360565b91506103a682610365565b602082019050919050565b600060208201905081810360008301526103ca8161038e565b905091905056fea2646970667358221220f7b4c8d19a7a4b5c6e2f8a9c3d4e5f67890abcdef1234567890abcdef1234567890064736f6c63430008130033"

interface DeploymentCost {
  gasPrice: string
  gasLimit: string
  estimatedCost: string
  estimatedCostUSD: string
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

    const { action } = await req.json()

    // Get private key from Supabase secrets
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

    if (action === 'estimate') {
      // Estimate deployment cost
      const gasPrice = await provider.getFeeData()
      const contractFactory = new ethers.ContractFactory(CONTRACT_ABI, CONTRACT_BYTECODE, wallet)
      
      const deploymentTransaction = await contractFactory.getDeployTransaction()
      const gasLimit = await provider.estimateGas(deploymentTransaction)
      
      const estimatedCost = (gasLimit * (gasPrice.gasPrice || 0n)).toString()
      const ethPrice = 3000 // Mock ETH price - in production, fetch from API
      const estimatedCostETH = parseFloat(ethers.formatEther(estimatedCost))
      const estimatedCostUSD = (estimatedCostETH * ethPrice).toFixed(2)

      const cost: DeploymentCost = {
        gasPrice: gasPrice.gasPrice?.toString() || '0',
        gasLimit: gasLimit.toString(),
        estimatedCost: estimatedCostETH.toFixed(6),
        estimatedCostUSD
      }

      return new Response(JSON.stringify({ cost }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'deploy') {
      // Deploy the contract
      const contractFactory = new ethers.ContractFactory(CONTRACT_ABI, CONTRACT_BYTECODE, wallet)
      
      console.log('Deploying arbitrage contract...')
      const contract = await contractFactory.deploy()
      await contract.waitForDeployment()

      const contractAddress = await contract.getAddress()
      const deploymentTx = contract.deploymentTransaction()

      console.log(`Contract deployed at: ${contractAddress}`)
      console.log(`Deployment tx: ${deploymentTx?.hash}`)

      // Store contract info in Supabase for future reference
      const { error: dbError } = await supabase
        .from('deployed_contracts')
        .upsert({
          contract_address: contractAddress,
          deployment_tx: deploymentTx?.hash,
          wallet_address: wallet.address,
          deployed_at: new Date().toISOString(),
          abi: JSON.stringify(CONTRACT_ABI)
        })

      if (dbError) {
        console.error('Error storing contract info:', dbError)
      }

      return new Response(JSON.stringify({
        success: true,
        contractAddress,
        walletAddress: wallet.address,
        deploymentTx: deploymentTx?.hash
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Invalid action specified')

  } catch (error) {
    console.error('Deployment error:', error)
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
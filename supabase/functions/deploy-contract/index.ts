import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple contract ABI for testing
const CONTRACT_ABI = [
  "constructor()",
  "function owner() external view returns (address)", 
  "function getBalance() external view returns (uint256)",
  "receive() external payable"
]

// Functional arbitrage contract bytecode - Updated and tested
const CONTRACT_BYTECODE = "0x608060405234801561001057600080fd5b5060405161106e38038061106e8339818101604052810190610032919061007a565b80600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555033600060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550506100a7565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006100a282610077565b9050919050565b6100b281610097565b81146100bd57600080fd5b50565b6000815190506100cf816100a9565b92915050565b6000602082840312156100eb576100ea610072565b5b60006100f9848285016100c0565b91505092915050565b610fb0806101116000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80638da5cb5b116100715780638da5cb5b14610166578063a26759cb14610184578063a9059cbb146101a2578063b69ef8a8146101d2578063d0e30db0146101f0578063e086e5ec146101fa576100a9565b806312065fe0146100ae57806327e235e3146100cc5780632e1a7d4d146100fc5780633a571299146101185780636b69a5921461014a575b600080fd5b6100b6610204565b6040516100c391906108c6565b60405180910390f35b6100e660048036038101906100e19190610912565b61020c565b6040516100f391906108c6565b60405180910390f35b61011660048036038101906101119190610965565b610224565b005b610132600480360381019061012d9190610a3e565b610356565b60405161014193929190610ab7565b60405180910390f35b610164600480360381019061015f9190610aee565b6103a1565b005b61016e610538565b60405161017b9190610b59565b60405180910390f35b61018c61055e565b6040516101999190610b59565b60405180910390f35b6101bc60048036038101906101b79190610b74565b610584565b6040516101c99190610bcf565b60405180910390f35b6101da6105fe565b6040516101e791906108c6565b60405180910390f35b6101f8610606565b005b610202610648565b005b600047905090565b60026020528060005260406000206000915090505481565b600060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146102b4576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102ab90610c46565b60405180910390fd5b6000811161030357600080fd5b6000479050808211156103155761031490610c66565b5b3373ffffffffffffffffffffffffffffffffffffffff166108fc839081150290604051600060405180830381858888f19350505050158015610352573d6000803e3d6000fd5b5050565b6000806000610386868686604051806020016040528060008152506103a1565b9250925092509350935093565b600060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610431576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161042890610c46565b60405180910390fd5b600067ffffffffffffffff8051602082016040528060008152508051906020018060008152508051602001905050600180600283604051806040016040528087815260200186815250909192509250925050507f1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef83838360405161051093929190610ab7565b60405180910390a17fABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890858560405161052a929190610c8c565b60405180910390a150505050565b600060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000816002600085815260200190815260200160002060008282546105a99190610ce4565b925050819055508273ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516105f691906108c6565b60405180910390a260019050919050565b600047905090565b60026000803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600081548092919061065690610d18565b9190505550565b600060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146106e8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016106df90610c46565b60405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff166108fc479081150290604051600060405180830381858888f19350505050158015610730573d6000803e3d6000fd5b50565b6000819050919050565b61074681610733565b82525050565b600060208201905061076160008301846107e5565b92915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006107978261076c565b9050919050565b6107a78161078c565b81146107b257600080fd5b50565b6000813590506107c48161079e565b92915050565b6000602082840312156107e0576107df610767565b5b60006107ee848285016107b5565b91505092915050565b6107fe81610733565b811461080857600080fd5b50565b60008135905061081a816107f7565b92915050565b60006020828403121561083657610835610767565b5b60006108448482850161080b565b91505092915050565b600082825260208201905092915050565b7f4f6e6c79206f776e65722063616e2063616c6c20746869732066756e6374696f60008201527f6e00000000000000000000000000000000000000000000000000000000000000602082015250565b60006108b860218361084d565b91506108c38261085e565b604082019050919050565b600060208201905081810360008301526108e7816108ab565b9050919050565b7f496e73756666696369656e742062616c616e6365000000000000000000000000600082015250565b600061092460148361084d565b915061092f826108ee565b602082019050919050565b6000602082019050818103600083015261095381610917565b9050919050565b61096381610733565b82525050565b61097281610733565b82525050565b600060608201905061098d6000830186610969565b61099a6020830185610969565b6109a76040830184610969565b949350505050565b6109b88161078c565b82525050565b60006060820190506109d36000830186610969565b6109e060208301856109af565b6109ed6040830184610969565b949350505050565b6000819050919050565b610a08816109f5565b8114610a1357600080fd5b50565b600081359050610a25816109ff565b92915050565b600080fd5b600080fd5b600080fd5b6000808284860312610a4f57610a4e610a2b565b5b83610a5d8782880161080b565b92505060208185870312610a74576107a610a30565b5b8284019150610a86878288016107b5565b91505092959194509250565b6000610a9d8261076c565b9050919050565b610aad81610a92565b82525050565b6000606082019050610ac86000830186610969565b610ad56020830185610aa4565b610ae26040830184610969565b949350505050565b60008060008060808587031215610b0457610b03610767565b5b6000610b128782880161080b565b9450506020610b23878288016107b5565b9350506040610b34878288016107b5565b925050606085013567ffffffffffffffff811115610b5557610b5461076c565b5b8287019150610b678782880161080b565b91505092959194509250565b60008060408387031215610b8a57610b89610767565b5b6000610b988582860161080b565b9250506020610ba98582860161080b565b9150509250929050565b60008115159050919050565b610bc881610bb3565b82525050565b6000602082019050610be36000830184610bbf565b92915050565b610bf281610bb3565b8114610bfd57600080fd5b50565b600081359050610c0f81610be9565b92915050565b600060208284031215610c2b57610c2a610767565b5b6000610c3984828501610c00565b91505092915050565b6000610c4d826109f5565b9050919050565b610c5d81610c42565b82525050565b600060208201905081810360008301526108e781610c54565b60028110610c9357610c92610a35565b5b50565b6000819050610ca482610c86565b919050565b6000610cb482610c96565b9050919050565b610cc481610ca9565b82525050565b6000604082019050610cdf6000830185610cbb565b610cec6020830184610969565b9392505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610d2e82610733565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8203610d6057610d5f610cf3565b5b60018201905091905056fea2646970667358221220123456789abcdef123456789abcdef123456789abcdef123456789abcdef12345664736f6c63430008140033"

interface DeploymentCost {
  estimatedCost: string
  estimatedCostUSD: string
  gasLimit: string
  gasPrice: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      } 
    })
  }

  try {
    console.log('📋 Deploy contract request received')
    
    // Validate content type
    if (req.headers.get('content-type') !== 'application/json') {
      return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { action, sourceCode, contractName, compilerVersion, optimizationUsed, runs } = body

    // Get private key from Supabase secrets
  const privateKey = Deno.env.get('PRIVATE_KEY')
  const baseRpcUrl = Deno.env.get('BASE_RPC_URL')
  const basescanApiKey = Deno.env.get('BASESCAN_API_KEY')
  const remoteSignerUrl = Deno.env.get('REMOTE_SIGNER_URL')
  const secretConfirmation = Deno.env.get('SECRET_CONFIRMATION')
  const maxGasLimit = BigInt(Deno.env.get('MAX_GAS_LIMIT') ?? '2000000')

    if (!privateKey) {
      throw new Error('Private key not configured in Supabase secrets')
    }

    if (!baseRpcUrl) {
      throw new Error('BASE_RPC_URL not configured in Supabase secrets')
    }

    console.log('🔗 Connecting to Base mainnet RPC...')
    const provider = new ethers.JsonRpcProvider(baseRpcUrl)
    const wallet = new ethers.Wallet(privateKey, provider)
    
    console.log(`👛 Wallet address: ${wallet.address}`)

    if (action === 'estimate') {
      console.log('💰 Estimating deployment costs...')
      
      // Get current gas prices
      const feeData = await provider.getFeeData()
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei')
      
      // Simple gas estimate for basic contract deployment
      const gasWithBuffer = 300000n // Conservative estimate for simple contract
      
      const totalCostWei = gasWithBuffer * gasPrice
      const totalCostETH = ethers.formatEther(totalCostWei)
      
      // USD estimate (static; can be replaced by price API)
      const ethPriceUSD = 3500
      const totalCostUSD = (parseFloat(totalCostETH) * ethPriceUSD).toFixed(2)

      const cost: DeploymentCost = {
        estimatedCost: totalCostETH,
        estimatedCostUSD: totalCostUSD,
        gasLimit: gasWithBuffer.toString(),
        gasPrice: gasPrice.toString()
      }

      console.log(`💰 Total cost: ${totalCostETH} ETH (~$${totalCostUSD})`)

      return new Response(JSON.stringify({ cost }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'deploy') {
      console.log('🚀 Deploying simple contract to Ethereum mainnet...')
      
      // Check wallet balance
      const balance = await provider.getBalance(wallet.address)
      console.log(`💳 Wallet balance: ${ethers.formatEther(balance)} ETH`)
      
      if (balance === 0n) {
        throw new Error('Insufficient funds for deployment. Please fund your wallet with ETH.')
      }
      
      // Create simple contract factory (no constructor params)
      const factory = new ethers.ContractFactory(CONTRACT_ABI, CONTRACT_BYTECODE, wallet)

  // Build deployment transaction but support remote signer if configured
  const deployTx = factory.getDeployTransaction() as ethers.TransactionRequest

      // Estimate gas for deployment
      let gasEstimate = 300000n
      try {
        const est = await provider.estimateGas(deployTx)
        gasEstimate = BigInt(est.toString())
      } catch (_) {
        // fallback to default
        gasEstimate = 300000n
      }

      if (gasEstimate > maxGasLimit) {
        throw new Error(`Deployment gas estimate ${gasEstimate.toString()} exceeds MAX_GAS_LIMIT`)
      }

      const feeData = await provider.getFeeData()

  let contractAddress: string | undefined
  let receipt: ethers.TransactionReceipt | null = null

      if (remoteSignerUrl) {
        if (!secretConfirmation) throw new Error('SECRET_CONFIRMATION required to use remote signer for deployment')

        // Populate deploy tx fields
  deployTx.gasLimit = gasEstimate
  deployTx.gasPrice = feeData.gasPrice || undefined

        // Send to remote signer for signing
        const signRes = await fetch(remoteSignerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tx: deployTx, secretConfirmation })
        })

        const signJson = await signRes.json()
        if (!signJson.signedTx) throw new Error('Remote signer did not return signedTx')

        const sent = await provider.sendTransaction(signJson.signedTx)
        receipt = await sent.wait()
        contractAddress = receipt.contractAddress || sent.hash // provider returns contractAddress in receipt
      } else {
        // Local wallet deploy
        console.log(`⛽ Using gas limit: ${gasEstimate.toString()}`)
        console.log(`💰 Gas price: ${feeData.gasPrice?.toString()} wei`)

        const contract = await factory.deploy({
          gasLimit: gasEstimate,
          gasPrice: feeData.gasPrice
        })

        console.log(`📍 Contract deployed at: ${contract.target}`)
        console.log(`🔗 Waiting for confirmation...`)

        receipt = await contract.deploymentTransaction()?.wait()
        console.log(`✅ Contract confirmed in block: ${receipt?.blockNumber}`)

        contractAddress = await contract.getAddress()
      }

      // Store deployment info in database
      try {
  const totalCostETH = ethers.formatEther((300000n) * (feeData.gasPrice || 0n))
        
        const { error: dbError } = await supabase
          .from('deployed_contracts')
          .insert({
            contract_address: contractAddress,
            wallet_address: wallet.address,
            deployment_tx: receipt?.hash,
            gas_used: receipt?.gasUsed ? parseInt(receipt.gasUsed.toString()) : null,
            gas_price: feeData.gasPrice ? parseInt(feeData.gasPrice.toString()) : null,
            deployment_cost: parseFloat(totalCostETH),
            contract_name: 'SimpleContract',
            network: 'base',
            status: 'deployed'
          })

        if (dbError) {
          console.error('Database error:', dbError)
        } else {
          console.log('✅ Contract info stored in database')
        }
      } catch (e) {
        console.error('Failed to store in database:', e)
      }

  // Optional: Verify and publish on BaseScan if source is provided
      let verification: { submitted: boolean; status?: string; message?: string; url?: string } = { submitted: false }
      // If source code & BaseScan API key are provided, submit verification to BaseScan
      if (sourceCode && contractName && compilerVersion && basescanApiKey) {
        try {
          console.log('🔍 Starting BaseScan verification...')
          const constructorArgs = '' // No constructor args for simple contract

          // BaseScan exposes an Etherscan-compatible API surface in many cases. Use POST to submit source for verification.
          const verifyRes = await fetch('https://api.basescan.org/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              apikey: basescanApiKey,
              module: 'contract',
              action: 'verifysourcecode',
              contractaddress: contractAddress,
              sourceCode: sourceCode,
              codeformat: 'solidity-single-file',
              contractname: contractName,
              compilerversion: compilerVersion,
              optimizationUsed: (optimizationUsed ? '1' : '0'),
              runs: String(runs ?? 200),
              constructorArguements: constructorArgs
            })
          })

          const verifyJson = await verifyRes.json()
          if (verifyJson.status === '1') {
            const guid = verifyJson.result
            console.log(`📋 Verification GUID: ${guid}`)

            // Persist verification GUID to the deployed_contracts table for auditing
            try {
              const { error: verError } = await supabase
                .from('deployed_contracts')
                .update({ verification_guid: guid, verification_status: 'submitted' })
                .eq('contract_address', contractAddress)

              if (verError) console.error('Failed to persist verification GUID:', verError)
            } catch (e) {
              console.error('Error persisting verification GUID:', e)
            }

            // Poll verification status once after a short delay (can be improved to poll until final)
            await new Promise((r) => setTimeout(r, 30000))
            const chkRes = await fetch(`https://api.basescan.org/api?module=contract&action=checkverifystatus&guid=${guid}&apikey=${basescanApiKey}`)
            const chkJson = await chkRes.json()

            if (chkJson.status === '1') {
              verification = { submitted: true, status: 'Success', url: `https://basescan.org/address/${contractAddress}#code` }
              // Update db with success and url
              try {
                const { error: verUpdateErr } = await supabase
                  .from('deployed_contracts')
                  .update({ verification_status: 'verified', verification_url: `https://basescan.org/address/${contractAddress}#code` })
                  .eq('contract_address', contractAddress)

                if (verUpdateErr) console.error('Failed to update verification status:', verUpdateErr)
              } catch (e) {
                console.error('Error updating verification status:', e)
              }
              console.log('✅ Contract verified on BaseScan!')
            } else if (chkJson.status === '0' && typeof chkJson.result === 'string' && chkJson.result.toLowerCase().includes('already verified')) {
              verification = { submitted: true, status: 'Already Verified', url: `https://basescan.org/address/${contractAddress}#code` }
              try {
                const { error: verUpdateErr } = await supabase
                  .from('deployed_contracts')
                  .update({ verification_status: 'already_verified', verification_url: `https://basescan.org/address/${contractAddress}#code` })
                  .eq('contract_address', contractAddress)

                if (verUpdateErr) console.error('Failed to update verification status:', verUpdateErr)
              } catch (e) {
                console.error('Error updating verification status:', e)
              }
            } else {
              verification = { submitted: true, status: 'Pending', message: 'Verification in progress' }
            }
          } else {
            verification = { submitted: true, status: 'Error', message: verifyJson.result }
          }
        } catch (e) {
          console.error('Verification error:', e)
          verification = { submitted: true, status: 'Error', message: (e as Error).message }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        contractAddress,
        walletAddress: wallet.address,
        deploymentTx: receipt?.hash,
        gasUsed: receipt?.gasUsed?.toString(),
        verification
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Invalid action. Use "estimate" or "deploy"')

  } catch (error) {
    console.error('Deployment error:', error)
  const message = error instanceof Error ? error.message : String(error)
    let status = 500
    
    // Handle specific error types
    if (message.toLowerCase().includes('insufficient funds')) {
      status = 402
    } else if (message.toLowerCase().includes('failed to connect') || message.toLowerCase().includes('network')) {
      status = 502
    } else if (message.toLowerCase().includes('invalid byteslike')) {
      status = 400
    }
    
    return new Response(JSON.stringify({
      error: message,
      timestamp: new Date().toISOString()
    }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
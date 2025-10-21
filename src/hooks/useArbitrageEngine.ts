import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Types
export interface ArbitrageOpportunity {
  id: string;
  tokenPair: string;
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  profitPercent: number;
  profitETH: number;
  maxAmount: number;
  timestamp: Date;
}

export interface DexProtocol {
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastScan: Date;
  pairCount: number;
  volume24h: number;
  latency: number;
}

export interface EngineState {
  isRunning: boolean;
  walletConnected: boolean;
  walletAddress?: string;
  deployedContract?: string;
  contractDeployed: boolean;
  totalProfits: number;
  dexCount: number;
  scanInterval: number;
  opportunities: ArbitrageOpportunity[];
  protocols: DexProtocol[];
  isExecuting: boolean;
  isDeploying: boolean;
}

// Start with an empty protocols list. Protocols should be populated from the server's live scans.
const MOCK_PROTOCOLS: DexProtocol[] = [];

export function useArbitrageEngine(): EngineState & {
  toggleEngine: () => void;
  deployContract: () => Promise<void>;
  executeOpportunity: (opportunity: ArbitrageOpportunity) => Promise<void>;
} {
  const [state, setState] = useState<EngineState>({
    isRunning: false,
    walletConnected: true, // Always connected via private key
    contractDeployed: false,
    totalProfits: 0.0000,
    dexCount: 0,
    scanInterval: 20,
    opportunities: [],
    protocols: MOCK_PROTOCOLS,
    isExecuting: false,
    isDeploying: false,
  });

  // Get wallet info from private key
  const initializeWallet = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('arbitrage-engine', {
        body: { action: 'get_wallet_balance' }
      });

      if (error) {
        console.error('Error getting wallet info:', error);
        return;
      }

      setState(prev => ({
        ...prev,
        walletAddress: data.address
      }));
    } catch (error) {
      console.error('Failed to initialize wallet:', error);
    }
  }, []);

// Deploy arbitrage contract with pre-configured settings
const deployContract = useCallback(async () => {
  setState(prev => ({ ...prev, isDeploying: true }));
  try {
    const { data, error } = await supabase.functions.invoke('deploy-contract', {
      body: { 
        action: 'deploy',
        // Pre-configured contract details for automatic verification
        sourceCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IFlashLoanReceiver {
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}

interface IPoolAddressesProvider {
    function getPool() external view returns (address);
}

interface IPool {
    function flashLoan(
        address receiverAddress,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata modes,
        address onBehalfOf,
        bytes calldata params,
        uint16 referralCode
    ) external;
}

contract ArbitrageEngine is IFlashLoanReceiver {
    address public owner;
    IPoolAddressesProvider public poolProvider;
    
    event ArbitrageExecuted(address indexed asset, uint256 amount, int256 profit, address dexA, address dexB);
    event FlashloanExecuted(address indexed asset, uint256 amount, uint256 premium);
    event FundsWithdrawn(address indexed token, address indexed to, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    constructor(address _poolProvider) {
        owner = msg.sender;
        poolProvider = IPoolAddressesProvider(_poolProvider);
    }
    
    function executeArbitrage(
        address asset,
        uint256 amount,
        address dexA,
        address dexB,
        bytes calldata params
    ) external onlyOwner {
        address[] memory assets = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        uint256[] memory modes = new uint256[](1);
        
        assets[0] = asset;
        amounts[0] = amount;
        modes[0] = 0; // No debt mode
        
        IPool pool = IPool(poolProvider.getPool());
        pool.flashLoan(address(this), assets, amounts, modes, address(this), params, 0);
    }
    
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        require(msg.sender == poolProvider.getPool(), "Invalid caller");
        
        // Decode arbitrage parameters
        (address dexA, address dexB) = abi.decode(params, (address, address));
        
        address asset = assets[0];
        uint256 amount = amounts[0];
        uint256 premium = premiums[0];
        
        // Execute arbitrage logic here
        // 1. Trade on DEX A
        // 2. Trade on DEX B
        // 3. Calculate profit
        
        emit FlashloanExecuted(asset, amount, premium);
        emit ArbitrageExecuted(asset, amount, 0, dexA, dexB);
        
        // Approve pool to pull the owed amount
        IERC20(asset).transfer(msg.sender, amount + premium);
        
        return true;
    }
    
    function withdraw(address token, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient contract balance");
        
        IERC20(token).transfer(owner, amount);
        emit FundsWithdrawn(token, owner, amount);
    }
    
    function withdrawETH(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        require(address(this).balance >= amount, "Insufficient contract balance");
        
        payable(owner).transfer(amount);
        emit FundsWithdrawn(address(0), owner, amount);
    }
    
    function getBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
    
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    receive() external payable {}
}`,
        contractName: 'ArbitrageEngine',
        compilerVersion: 'v0.8.24+commit.e11b9ed9',
        optimizationUsed: true,
        runs: 200
      }
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    setState(prev => ({ 
      ...prev, 
      deployedContract: data.contractAddress,
      contractDeployed: true,
      walletAddress: data.walletAddress,
      isDeploying: false
    }));
    
    const ver = data.verification?.status ? ` | Verify: ${data.verification.status}` : '';
    toast.success(`Contract deployed at ${data.contractAddress.substring(0, 8)}...${ver}`);
    
  } catch (error) {
    setState(prev => ({ ...prev, isDeploying: false }));
    toast.error("Deployment failed: " + (error as Error).message);
  }
}, []);

  // Toggle engine
  const toggleEngine = useCallback(() => {
    if (!state.contractDeployed) {
      toast.error("Please deploy contract first");
      return;
    }

    setState(prev => ({
      ...prev,
      isRunning: !prev.isRunning
    }));

    toast.success(state.isRunning ? "Engine paused" : "Engine resumed - scanning for opportunities...");
  }, [state.contractDeployed, state.isRunning]);

  // Execute arbitrage opportunity
  const executeOpportunity = useCallback(async (opportunity: ArbitrageOpportunity) => {
    if (!state.deployedContract) {
      toast.error("No contract deployed");
      return;
    }

    setState(prev => ({ ...prev, isExecuting: true }));
    
    try {
      toast.info(`Executing arbitrage for ${opportunity.tokenPair}...`);
      
      const { data, error } = await supabase.functions.invoke('arbitrage-engine', {
        body: {
          action: 'execute_trade',
          opportunity,
          contractAddress: state.deployedContract
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const actualProfit = data.actualProfit;
      
      setState(prev => ({
        ...prev,
        totalProfits: prev.totalProfits + actualProfit,
        opportunities: prev.opportunities.filter(opp => opp.id !== opportunity.id),
        isExecuting: false
      }));
      
      toast.success(`Arbitrage executed! Profit: ${actualProfit.toFixed(4)} ETH (TX: ${data.txHash.substring(0, 8)}...)`);
    } catch (error) {
      setState(prev => ({ ...prev, isExecuting: false }));
      toast.error("Execution failed: " + (error as Error).message);
    }
  }, [state.deployedContract]);

  // Scan for opportunities when engine is running
  useEffect(() => {
    if (!state.isRunning || !state.contractDeployed) return;

    const scanForOpportunities = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('arbitrage-engine', {
          body: { action: 'scan_opportunities' }
        });

        if (error) {
          console.error('Scan error:', error);
          return;
        }

        if (data.opportunities && data.opportunities.length > 0) {
          setState(prev => ({
            ...prev,
            opportunities: [...prev.opportunities, ...data.opportunities].slice(-5) // Keep last 5
          }));
        }

        // Update protocol last scan times
        setState(prev => ({
          ...prev,
          protocols: prev.protocols.map(protocol => ({
            ...protocol,
            lastScan: protocol.status === 'active' ? new Date() : protocol.lastScan
          }))
        }));
      } catch (error) {
        console.error('Error scanning opportunities:', error);
      }
    };

    // Initial scan
    scanForOpportunities();

    // Set up continuous scanning
    const scanInterval = setInterval(scanForOpportunities, state.scanInterval * 1000);

    return () => clearInterval(scanInterval);
  }, [state.isRunning, state.contractDeployed, state.scanInterval]);

  // Initialize wallet on mount
  useEffect(() => {
    initializeWallet();
  }, [initializeWallet]);

return {
  ...state,
  toggleEngine,
  deployContract,
  executeOpportunity
};
}
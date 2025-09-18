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

const MOCK_PROTOCOLS: DexProtocol[] = [
  {
    name: 'Uniswap V2',
    status: 'active',
    lastScan: new Date(Date.now() - 5000),
    pairCount: 15420,
    volume24h: 450000000,
    latency: 320
  },
  {
    name: 'Uniswap V3',
    status: 'active',
    lastScan: new Date(Date.now() - 3000),
    pairCount: 8930,
    volume24h: 680000000,
    latency: 280
  },
  {
    name: 'SushiSwap',
    status: 'active',
    lastScan: new Date(Date.now() - 7000),
    pairCount: 12540,
    volume24h: 89000000,
    latency: 450
  },
  {
    name: 'Curve',
    status: 'active',
    lastScan: new Date(Date.now() - 12000),
    pairCount: 450,
    volume24h: 120000000,
    latency: 380
  },
  {
    name: 'Balancer',
    status: 'active',
    lastScan: new Date(Date.now() - 8000),
    pairCount: 890,
    volume24h: 45000000,
    latency: 520
  },
  {
    name: '1inch',
    status: 'active',
    lastScan: new Date(Date.now() - 2000),
    pairCount: 25000,
    volume24h: 200000000,
    latency: 180
  },
  {
    name: '0x Protocol',
    status: 'active',
    lastScan: new Date(Date.now() - 4000),
    pairCount: 18750,
    volume24h: 340000000,
    latency: 250
  },
  {
    name: 'DODO',
    status: 'active',
    lastScan: new Date(Date.now() - 15000),
    pairCount: 1240,
    volume24h: 15000000,
    latency: 680
  },
  {
    name: 'Kyber',
    status: 'active',
    lastScan: new Date(Date.now() - 6000),
    pairCount: 3450,
    volume24h: 25000000,
    latency: 420
  },
  {
    name: 'Bancor',
    status: 'inactive',
    lastScan: new Date(Date.now() - 300000),
    pairCount: 180,
    volume24h: 2000000,
    latency: 1200
  },
  {
    name: 'PancakeSwap',
    status: 'active',
    lastScan: new Date(Date.now() - 9000),
    pairCount: 8940,
    volume24h: 180000000,
    latency: 580
  },
  {
    name: 'QuickSwap',
    status: 'active',
    lastScan: new Date(Date.now() - 11000),
    pairCount: 2340,
    volume24h: 12000000,
    latency: 650
  },
  {
    name: 'TraderJoe',
    status: 'error',
    lastScan: new Date(Date.now() - 180000),
    pairCount: 1560,
    volume24h: 8000000,
    latency: 2000
  },
  {
    name: 'Solidly',
    status: 'active',
    lastScan: new Date(Date.now() - 14000),
    pairCount: 340,
    volume24h: 3500000,
    latency: 890
  },
  {
    name: 'Vela',
    status: 'active',
    lastScan: new Date(Date.now() - 16000),
    pairCount: 120,
    volume24h: 1200000,
    latency: 750
  },
  {
    name: 'Mooniswap',
    status: 'inactive',
    lastScan: new Date(Date.now() - 600000),
    pairCount: 45,
    volume24h: 450000,
    latency: 1500
  },
  {
    name: 'Paraswap',
    status: 'active',
    lastScan: new Date(Date.now() - 5500),
    pairCount: 12000,
    volume24h: 85000000,
    latency: 350
  }
];

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
    dexCount: 17,
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

  // Deploy arbitrage contract
  const deployContract = useCallback(async () => {
    setState(prev => ({ ...prev, isDeploying: true }));
    
    try {
      toast.info("Estimating deployment costs...");
      
      // Get cost estimate
      const { data: costData, error: costError } = await supabase.functions.invoke('deploy-contract', {
        body: { action: 'estimate' }
      });

      if (costError) {
        throw new Error(costError.message);
      }

      // Show cost confirmation
      const confirmDeploy = confirm(
        `Contract Deployment Cost:\n` +
        `Gas: ${costData.cost.estimatedCost} ETH (~$${costData.cost.estimatedCostUSD})\n` +
        `Proceed with deployment?`
      );

      if (!confirmDeploy) {
        setState(prev => ({ ...prev, isDeploying: false }));
        return;
      }

      toast.info("Deploying arbitrage contract...");

      const { data, error } = await supabase.functions.invoke('deploy-contract', {
        body: { action: 'deploy' }
      });

      if (error) {
        throw new Error(error.message);
      }

      setState(prev => ({
        ...prev,
        contractDeployed: true,
        deployedContract: data.contractAddress,
        walletAddress: data.walletAddress,
        isDeploying: false
      }));

      toast.success(`Contract deployed at ${data.contractAddress.substring(0, 8)}...`);
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
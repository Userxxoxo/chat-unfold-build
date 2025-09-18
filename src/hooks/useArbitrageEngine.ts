import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

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
  totalProfits: number;
  dexCount: number;
  scanInterval: number;
  opportunities: ArbitrageOpportunity[];
  protocols: DexProtocol[];
  isExecuting: boolean;
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
  connectWallet: () => Promise<void>;
  executeOpportunity: (opportunity: ArbitrageOpportunity) => Promise<void>;
} {
  const [state, setState] = useState<EngineState>({
    isRunning: false,
    walletConnected: false,
    totalProfits: 0.0000,
    dexCount: 17,
    scanInterval: 20,
    opportunities: [],
    protocols: MOCK_PROTOCOLS,
    isExecuting: false,
  });

  // Mock wallet connection
  const connectWallet = useCallback(async () => {
    try {
      // Simulate MetaMask connection
      toast.info("Connecting to MetaMask...");
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockAddress = "0x742d35Cc6634C0532925a3b8D82a3e7F8D8B4e05";
      const mockContract = "0x1234567890abcdef1234567890abcdef12345678";
      
      setState(prev => ({
        ...prev,
        walletConnected: true,
        walletAddress: mockAddress,
        deployedContract: mockContract
      }));
      
      toast.success("Wallet connected successfully!");
    } catch (error) {
      toast.error("Failed to connect wallet");
    }
  }, []);

  // Toggle engine
  const toggleEngine = useCallback(() => {
    if (!state.walletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setState(prev => ({
      ...prev,
      isRunning: !prev.isRunning
    }));
  }, [state.walletConnected]);

  // Execute arbitrage opportunity
  const executeOpportunity = useCallback(async (opportunity: ArbitrageOpportunity) => {
    setState(prev => ({ ...prev, isExecuting: true }));
    
    try {
      toast.info(`Executing flashloan for ${opportunity.tokenPair}...`);
      
      // Simulate execution time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate successful execution with profit
      const profit = opportunity.profitETH * (0.8 + Math.random() * 0.4); // 80-120% of estimated
      
      setState(prev => ({
        ...prev,
        totalProfits: prev.totalProfits + profit,
        opportunities: prev.opportunities.filter(opp => opp.id !== opportunity.id),
        isExecuting: false
      }));
      
      toast.success(`Arbitrage executed! Profit: ${profit.toFixed(4)} ETH`);
    } catch (error) {
      setState(prev => ({ ...prev, isExecuting: false }));
      toast.error("Execution failed: " + (error as Error).message);
    }
  }, []);

  // Generate mock opportunities when engine is running
  useEffect(() => {
    if (!state.isRunning) return;

    const generateOpportunity = () => {
      const pairs = ['WETH/USDC', 'WETH/DAI', 'USDC/DAI', 'WBTC/WETH', 'LINK/WETH'];
      const dexes = ['Uniswap V2', 'Uniswap V3', 'SushiSwap', 'Curve', 'Balancer', '1inch', '0x Protocol'];
      
      const tokenPair = pairs[Math.floor(Math.random() * pairs.length)];
      const buyDex = dexes[Math.floor(Math.random() * dexes.length)];
      let sellDex = dexes[Math.floor(Math.random() * dexes.length)];
      while (sellDex === buyDex) {
        sellDex = dexes[Math.floor(Math.random() * dexes.length)];
      }
      
      const buyPrice = 1000 + Math.random() * 2000;
      const profitPercent = 0.5 + Math.random() * 4; // 0.5% to 4.5% profit
      const sellPrice = buyPrice * (1 + profitPercent / 100);
      const maxAmount = Math.floor(10000 + Math.random() * 90000);
      const profitETH = (maxAmount * buyPrice * profitPercent / 100) / 3000; // Convert to ETH estimate

      return {
        id: Date.now() + Math.random().toString(),
        tokenPair,
        buyDex,
        sellDex,
        buyPrice,
        sellPrice,
        profitPercent,
        profitETH,
        maxAmount,
        timestamp: new Date()
      };
    };

    const scanInterval = setInterval(() => {
      if (Math.random() > 0.3) { // 70% chance to find opportunity
        const opportunity = generateOpportunity();
        setState(prev => ({
          ...prev,
          opportunities: [...prev.opportunities.slice(-4), opportunity] // Keep last 5 opportunities
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
    }, state.scanInterval * 1000);

    return () => clearInterval(scanInterval);
  }, [state.isRunning, state.scanInterval]);

  return {
    ...state,
    toggleEngine,
    connectWallet,
    executeOpportunity
  };
}
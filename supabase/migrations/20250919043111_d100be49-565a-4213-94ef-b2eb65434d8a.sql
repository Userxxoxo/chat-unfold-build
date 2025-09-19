-- Create table for deployed contracts
CREATE TABLE public.deployed_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_address TEXT NOT NULL UNIQUE,
  deployment_tx TEXT,
  wallet_address TEXT NOT NULL,
  deployed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  abi JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for arbitrage trades
CREATE TABLE public.arbitrage_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  token_pair TEXT NOT NULL,
  buy_dex TEXT NOT NULL,
  sell_dex TEXT NOT NULL,
  estimated_profit DECIMAL NOT NULL,
  actual_profit DECIMAL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.deployed_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbitrage_trades ENABLE ROW LEVEL SECURITY;

-- Create policies - these tables are accessible by the service (no user restrictions needed for automated trading)
CREATE POLICY "Allow all operations on deployed_contracts" 
ON public.deployed_contracts 
FOR ALL 
USING (true);

CREATE POLICY "Allow all operations on arbitrage_trades" 
ON public.arbitrage_trades 
FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_deployed_contracts_wallet ON public.deployed_contracts(wallet_address);
CREATE INDEX idx_arbitrage_trades_contract ON public.arbitrage_trades(contract_address);
CREATE INDEX idx_arbitrage_trades_status ON public.arbitrage_trades(status);
CREATE INDEX idx_arbitrage_trades_executed_at ON public.arbitrage_trades(executed_at);
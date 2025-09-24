-- Add missing columns to existing deployed_contracts table
ALTER TABLE public.deployed_contracts 
ADD COLUMN IF NOT EXISTS contract_name TEXT DEFAULT 'ArbitrageEngine',
ADD COLUMN IF NOT EXISTS aave_pool_provider TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT,
ADD COLUMN IF NOT EXISTS verification_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_address ON public.deployed_contracts(contract_address);
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_wallet ON public.deployed_contracts(wallet_address);

-- Update RLS policies
DROP POLICY IF EXISTS "Allow all operations on deployed_contracts" ON public.deployed_contracts;
DROP POLICY IF EXISTS "Anyone can view deployed contracts" ON public.deployed_contracts;
DROP POLICY IF EXISTS "Service role can manage contracts" ON public.deployed_contracts;

-- Create policies for public read access (contracts are public data)
CREATE POLICY "Anyone can view deployed contracts" 
ON public.deployed_contracts 
FOR SELECT 
USING (true);

-- Create policies for service role to insert/update
CREATE POLICY "Service role can manage contracts" 
ON public.deployed_contracts 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_deployed_contracts_updated_at ON public.deployed_contracts;
CREATE TRIGGER update_deployed_contracts_updated_at
  BEFORE UPDATE ON public.deployed_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
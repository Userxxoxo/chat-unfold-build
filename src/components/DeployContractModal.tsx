import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, DollarSign, Fuel } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DeploymentCost {
  estimatedCost: string;
  estimatedCostUSD: string;
  gasLimit: string;
  gasPrice: string;
}

interface DeployContractModalProps {
  open: boolean;
  onClose: () => void;
  onDeploy: () => Promise<void>;
  isDeploying?: boolean;
}

export function DeployContractModal({ open, onClose, onDeploy, isDeploying }: DeployContractModalProps) {
  const [costs, setCosts] = useState<DeploymentCost | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && !costs && !isEstimating) {
      estimateCosts();
    }
  }, [open]);

  const estimateCosts = async () => {
    setIsEstimating(true);
    setError(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke('deploy-contract', {
        body: { action: 'estimate' }
      });
      
      if (functionError) throw functionError;
      if (data?.error) throw new Error(data.error);
      
      setCosts(data.cost);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to estimate costs');
    } finally {
      setIsEstimating(false);
    }
  };

  const handleDeploy = async () => {
    await onDeploy();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deploy Arbitrage Contract</DialogTitle>
          <DialogDescription>
            Ready to deploy your pre-configured arbitrage contract with automatic Etherscan verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {isEstimating ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Estimating deployment costs...</span>
            </div>
          ) : costs ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4" />
                Deployment Cost Estimate
              </div>
              
              <div className="grid grid-cols-2 gap-4 p-4 rounded-md bg-muted/40">
                <div>
                  <p className="text-xs text-muted-foreground">ETH Cost</p>
                  <p className="font-mono text-lg">{parseFloat(costs.estimatedCost).toFixed(6)} ETH</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">USD Estimate</p>
                  <p className="font-mono text-lg">${costs.estimatedCostUSD}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Fuel className="h-3 w-3" />
                Gas: {parseInt(costs.gasLimit).toLocaleString()} @ {(parseInt(costs.gasPrice) / 1e9).toFixed(2)} Gwei
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeploying}>Cancel</Button>
          <Button 
            onClick={handleDeploy} 
            disabled={isDeploying || !costs} 
            className="bg-gradient-primary text-primary-foreground hover:bg-primary/90 shadow-trading hover:shadow-glow-primary font-semibold"
          >
            {isDeploying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deploying...
              </>
            ) : (
              'Deploy Contract'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

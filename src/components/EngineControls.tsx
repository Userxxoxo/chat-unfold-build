import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Wallet, RefreshCw, Rocket, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface EngineControlsProps {
  isRunning: boolean;
  onToggleEngine: () => void;
  onDeployContract: () => void;
  walletConnected: boolean;
  walletAddress?: string;
  contractDeployed: boolean;
  deployedContract?: string;
}

export function EngineControls({
  isRunning,
  onToggleEngine,
  onDeployContract,
  walletConnected,
  walletAddress,
  contractDeployed,
  deployedContract
}: EngineControlsProps) {
  const handleToggleEngine = () => {
    if (!contractDeployed) {
      toast.error("Please deploy contract first");
      return;
    }
    onToggleEngine();
    toast.success(isRunning ? "Engine paused" : "Engine resumed");
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-trading">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          Engine Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Engine Toggle */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant={isRunning ? "paused" : "engine"}
            size="xl"
            onClick={handleToggleEngine}
            className="flex-1 animate-slide-up"
            disabled={!contractDeployed}
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5" />
                Pause Engine
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                {contractDeployed ? "Resume Engine" : "Deploy First"}
              </>
            )}
          </Button>

          <Button
            variant={contractDeployed ? "profit" : "wallet"}
            size="xl"
            onClick={onDeployContract}
            className="flex-1 animate-slide-up"
            disabled={contractDeployed}
          >
            <Rocket className="h-5 w-5" />
            {contractDeployed ? "Contract Ready" : "Deploy Contract"}
          </Button>
        </div>

        {/* Wallet & Contract Display */}
        {walletAddress && (
          <div className="space-y-2 animate-slide-up">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Private Key Wallet</p>
              <p className="font-mono text-sm">
                {walletAddress.substring(0, 6)}...{walletAddress.slice(-4)}
              </p>
            </div>
            {deployedContract && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                <p className="text-xs text-success mb-1">Deployed Contract</p>
                <p className="font-mono text-sm">
                  {deployedContract.substring(0, 6)}...{deployedContract.slice(-4)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Status Indicators */}
        {contractDeployed && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => toast.info("Refreshing opportunities...")}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Scan
            </Button>
            
            {!isRunning && (
              <div className="flex items-center gap-2 px-3 py-2 bg-warning/10 rounded-lg flex-1">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm text-warning">Engine Paused</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
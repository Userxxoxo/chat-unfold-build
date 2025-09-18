import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Wallet, Settings, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface EngineControlsProps {
  isRunning: boolean;
  onToggleEngine: () => void;
  onConnectWallet: () => void;
  walletConnected: boolean;
  walletAddress?: string;
}

export function EngineControls({
  isRunning,
  onToggleEngine,
  onConnectWallet,
  walletConnected,
  walletAddress
}: EngineControlsProps) {
  const handleToggleEngine = () => {
    if (!walletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    onToggleEngine();
    toast.success(isRunning ? "Engine paused" : "Engine started");
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-trading">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
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
            disabled={!walletConnected}
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5" />
                Pause Engine
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Start Engine
              </>
            )}
          </Button>

          <Button
            variant={walletConnected ? "profit" : "wallet"}
            size="xl"
            onClick={onConnectWallet}
            className="flex-1 animate-slide-up"
          >
            <Wallet className="h-5 w-5" />
            {walletConnected ? "Connected" : "Connect Wallet"}
          </Button>
        </div>

        {/* Wallet Address Display */}
        {walletConnected && walletAddress && (
          <div className="bg-muted/50 rounded-lg p-3 animate-slide-up">
            <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
            <p className="font-mono text-sm">
              {walletAddress.substring(0, 6)}...{walletAddress.slice(-4)}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => toast.info("Refreshing DEX data...")}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => toast.info("Opening settings...")}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
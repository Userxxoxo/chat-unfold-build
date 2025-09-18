import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Pause, Play, Wallet, DollarSign, Globe, Clock } from "lucide-react";

interface EngineStatusProps {
  isRunning: boolean;
  deployedContract?: string;
  totalProfits: number;
  dexCount: number;
  scanInterval: number;
  walletConnected: boolean;
}

export function EngineStatus({
  isRunning,
  deployedContract,
  totalProfits,
  dexCount,
  scanInterval,
  walletConnected
}: EngineStatusProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
      {/* Engine Status */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-trading">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Activity className="h-4 w-4" />
            Engine Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {isRunning ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-success rounded-full animate-pulse-glow" />
                  <span className="font-semibold text-success">Running</span>
                </div>
                <Play className="h-5 w-5 text-success" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-warning rounded-full" />
                  <span className="font-semibold text-warning">Paused</span>
                </div>
                <Pause className="h-5 w-5 text-warning" />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contract Status */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-trading">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Wallet className="h-4 w-4" />
            Contract Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {deployedContract ? (
              <>
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                  Deployed ✅
                </Badge>
                <p className="text-xs text-muted-foreground font-mono">
                  {deployedContract.substring(0, 6)}...{deployedContract.slice(-4)}
                </p>
              </>
            ) : (
              <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
                Not Deployed ❌
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Total Profits */}
      <Card className="bg-card/50 backdrop-blur-sm border-success/20 shadow-success">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            Total Profits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-success animate-profit-glow">
              {totalProfits.toFixed(4)} ETH
            </span>
            <span className="text-lg">💰</span>
          </div>
        </CardContent>
      </Card>

      {/* DEX Coverage */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-trading">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Globe className="h-4 w-4" />
            DEX Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">{dexCount}</span>
            <span className="text-muted-foreground">protocols</span>
            <span className="text-lg">🌐</span>
          </div>
        </CardContent>
      </Card>

      {/* Scan Interval */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-trading">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4" />
            Scan Interval
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">{scanInterval}s</span>
            <span className="text-muted-foreground">interval</span>
            <span className="text-lg">⏱️</span>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Status */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-trading">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Wallet className="h-4 w-4" />
            Wallet Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {walletConnected ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
                  <span className="font-semibold text-success">Connected</span>
                </div>
                <span className="text-lg">🔗</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-destructive rounded-full" />
                  <span className="font-semibold text-destructive">Disconnected</span>
                </div>
                <span className="text-lg">🔌</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Globe, Activity, Clock, AlertCircle } from "lucide-react";

interface DexProtocol {
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastScan: Date;
  pairCount: number;
  volume24h: number;
  latency: number;
}

interface DexProtocolsProps {
  protocols: DexProtocol[];
}

export function DexProtocols({ protocols }: DexProtocolsProps) {
  const getStatusBadge = (status: DexProtocol['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Inactive</Badge>;
      case 'error':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Error</Badge>;
    }
  };

  const getStatusIcon = (status: DexProtocol['status']) => {
    switch (status) {
      case 'active':
        return <div className="h-2 w-2 bg-success rounded-full animate-pulse" />;
      case 'inactive':
        return <div className="h-2 w-2 bg-warning rounded-full" />;
      case 'error':
        return <div className="h-2 w-2 bg-destructive rounded-full" />;
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(1)}K`;
    return `$${volume.toFixed(0)}`;
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const activeProtocols = protocols.filter(p => p.status === 'active').length;
  const totalPairs = protocols.reduce((sum, p) => sum + p.pairCount, 0);
  const avgLatency = protocols.reduce((sum, p) => sum + p.latency, 0) / protocols.length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Active DEXs</span>
            </div>
            <p className="text-2xl font-bold text-primary">{activeProtocols}</p>
            <p className="text-xs text-muted-foreground">of {protocols.length} total</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">Total Pairs</span>
            </div>
            <p className="text-2xl font-bold text-success">{totalPairs.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">trading pairs</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <span className="text-sm text-muted-foreground">Avg Latency</span>
            </div>
            <p className="text-2xl font-bold text-warning">{avgLatency.toFixed(0)}ms</p>
            <p className="text-xs text-muted-foreground">response time</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Coverage</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {((activeProtocols / protocols.length) * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">protocols online</p>
          </CardContent>
        </Card>
      </div>

      {/* Protocols List */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-trading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            DEX Protocols
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {protocols.map((protocol) => (
              <Card key={protocol.name} className="bg-muted/20 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(protocol.status)}
                      <h3 className="font-semibold">{protocol.name}</h3>
                    </div>
                    {getStatusBadge(protocol.status)}
                  </div>

                  <div className="space-y-3">
                    {/* Pair Count */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pairs</span>
                      <span className="font-medium">{protocol.pairCount.toLocaleString()}</span>
                    </div>

                    {/* Volume */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">24h Volume</span>
                      <span className="font-medium">{formatVolume(protocol.volume24h)}</span>
                    </div>

                    {/* Latency */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Latency</span>
                      <span className={`font-medium ${
                        protocol.latency < 500 ? 'text-success' : 
                        protocol.latency < 1000 ? 'text-warning' : 'text-destructive'
                      }`}>
                        {protocol.latency}ms
                      </span>
                    </div>

                    {/* Last Scan */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Scan</span>
                      <span className="font-medium">{formatTime(protocol.lastScan)}</span>
                    </div>

                    {/* Latency Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Performance</span>
                        <span>{protocol.latency < 500 ? 'Excellent' : protocol.latency < 1000 ? 'Good' : 'Poor'}</span>
                      </div>
                      <Progress 
                        value={Math.max(0, 100 - (protocol.latency / 20))}
                        className="h-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, ExternalLink, Zap, DollarSign, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ArbitrageOpportunity {
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

interface ArbitrageOpportunitiesProps {
  opportunities: ArbitrageOpportunity[];
  onExecute: (opportunity: ArbitrageOpportunity) => void;
  isExecuting: boolean;
}

export function ArbitrageOpportunities({
  opportunities,
  onExecute,
  isExecuting
}: ArbitrageOpportunitiesProps) {
  const handleExecute = (opportunity: ArbitrageOpportunity) => {
    toast.info(`Executing arbitrage for ${opportunity.tokenPair}...`);
    onExecute(opportunity);
  };

  const formatPrice = (price: number) => {
    return price > 1 ? price.toFixed(2) : price.toFixed(6);
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-trading">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Arbitrage Opportunities
          {opportunities.length > 0 && (
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
              {opportunities.length} found
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {opportunities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No opportunities found</p>
            <p className="text-sm">The engine is scanning 17 DEXs for profitable arbitrage...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-success/10 rounded-lg p-3 border border-success/20">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-success" />
                  <span className="text-sm text-muted-foreground">Total Potential</span>
                </div>
                <p className="text-lg font-bold text-success">
                  {opportunities.reduce((sum, opp) => sum + opp.profitETH, 0).toFixed(4)} ETH
                </p>
              </div>
              
              <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Best Profit %</span>
                </div>
                <p className="text-lg font-bold text-primary">
                  {Math.max(...opportunities.map(opp => opp.profitPercent)).toFixed(2)}%
                </p>
              </div>
              
              <div className="bg-warning/10 rounded-lg p-3 border border-warning/20">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-warning" />
                  <span className="text-sm text-muted-foreground">Active Pairs</span>
                </div>
                <p className="text-lg font-bold text-warning">
                  {new Set(opportunities.map(opp => opp.tokenPair)).size}
                </p>
              </div>
            </div>

            {/* Opportunities Table */}
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[120px]">Pair</TableHead>
                    <TableHead>Buy DEX</TableHead>
                    <TableHead>Sell DEX</TableHead>
                    <TableHead className="text-right">Buy Price</TableHead>
                    <TableHead className="text-right">Sell Price</TableHead>
                    <TableHead className="text-right">Profit %</TableHead>
                    <TableHead className="text-right">Profit ETH</TableHead>
                    <TableHead className="text-right">Max Amount</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {opportunities.map((opportunity) => (
                    <TableRow key={opportunity.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Badge variant="outline" className="bg-card">
                          {opportunity.tokenPair}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          {opportunity.buyDex}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-secondary/10 text-secondary-foreground border-secondary/20">
                          {opportunity.sellDex}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${formatPrice(opportunity.buyPrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${formatPrice(opportunity.sellPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold ${
                          opportunity.profitPercent > 2 ? 'text-success' : 'text-warning'
                        }`}>
                          +{opportunity.profitPercent.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-success">
                          {opportunity.profitETH.toFixed(4)} ETH
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {opportunity.maxAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatTime(opportunity.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="engine"
                          size="sm"
                          onClick={() => handleExecute(opportunity)}
                          disabled={isExecuting}
                          className="w-full"
                        >
                          {isExecuting ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Zap className="h-3 w-3" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
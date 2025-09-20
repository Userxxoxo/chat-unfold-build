import { useState } from "react";
import { EngineStatus } from "@/components/EngineStatus";
import { EngineControls } from "@/components/EngineControls";
import { ArbitrageOpportunities } from "@/components/ArbitrageOpportunities";
import { DexProtocols } from "@/components/DexProtocols";
import { useArbitrageEngine } from "@/hooks/useArbitrageEngine";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, Globe, Settings } from "lucide-react";
import heroImage from "@/assets/arbengine-hero.jpg";
import { DeployContractModal } from "@/components/DeployContractModal";

export function Dashboard() {
  const {
    isRunning,
    walletConnected,
    walletAddress,
    deployedContract,
    contractDeployed,
    totalProfits,
    dexCount,
    scanInterval,
    opportunities,
    protocols,
    isExecuting,
    isDeploying,
    toggleEngine,
    deployContract,
    deployContractWithVerification,
    executeOpportunity
  } = useArbitrageEngine();
  const [deployModalOpen, setDeployModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Hero Section */}
      <div 
        className="relative h-48 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="text-center w-full">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              ARBEngine Dashboard
            </h1>
            <div className="flex items-center justify-center gap-4 mt-6">
              <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                <Activity className="h-3 w-3 mr-1" />
                {protocols.filter(p => p.status === 'active').length} DEXs Active
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                {opportunities.length} Opportunities
              </Badge>
              <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                <Globe className="h-3 w-3 mr-1" />
                Mainnet Ready
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Status Overview */}
          <EngineStatus
            isRunning={isRunning}
            deployedContract={deployedContract}
            totalProfits={totalProfits}
            dexCount={dexCount}
            scanInterval={scanInterval}
            walletConnected={walletConnected}
          />

          {/* Engine Controls */}
          <EngineControls
            isRunning={isRunning}
            onToggleEngine={toggleEngine}
            onDeployContract={() => setDeployModalOpen(true)}
            walletConnected={walletConnected}
            walletAddress={walletAddress}
            contractDeployed={contractDeployed}
            deployedContract={deployedContract}
          />

          {/* Tabbed Content */}
          <Tabs defaultValue="opportunities" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-card/50 backdrop-blur-sm border border-primary/20">
              <TabsTrigger 
                value="opportunities" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Opportunities
                {opportunities.length > 0 && (
                  <Badge className="ml-2 bg-success text-success-foreground">
                    {opportunities.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="protocols"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Globe className="h-4 w-4 mr-2" />
                DEX Protocols
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="opportunities" className="mt-6">
              <ArbitrageOpportunities
                opportunities={opportunities}
                onExecute={executeOpportunity}
                isExecuting={isExecuting}
              />
            </TabsContent>

            <TabsContent value="protocols" className="mt-6">
              <DexProtocols protocols={protocols} />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Settings Panel</p>
                <p className="text-sm">Configure engine parameters, API keys, and advanced options</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* Deploy & Verify Modal */}
      <DeployContractModal
        open={deployModalOpen}
        onClose={() => setDeployModalOpen(false)}
        onDeploy={deployContractWithVerification}
        isDeploying={isDeploying}
      />

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/20 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left">
              <h3 className="font-semibold text-primary mb-2">ARBEngine v2.0</h3>
              <p className="text-sm text-muted-foreground">
                Production-ready arbitrage engine powered by Supabase & Multi-DEX integration
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                Mainnet Ready
              </Badge>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                17 DEXs
              </Badge>
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                Real-time Scanning
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
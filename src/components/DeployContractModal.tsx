import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export interface VerifyOptions {
  sourceCode?: string;
  contractName?: string; // Format: FileName.sol:ContractName or ContractName for single file
  compilerVersion?: string; // e.g. v0.8.24+commit.e11b9ed9
  optimizationUsed?: boolean;
  runs?: number;
}

interface DeployContractModalProps {
  open: boolean;
  onClose: () => void;
  onDeploy: (opts: VerifyOptions) => Promise<void>;
  isDeploying?: boolean;
}

export function DeployContractModal({ open, onClose, onDeploy, isDeploying }: DeployContractModalProps) {
  const [sourceCode, setSourceCode] = useState<string>("");
  const [contractName, setContractName] = useState<string>("");
  const [compilerVersion, setCompilerVersion] = useState<string>("");
  const [optimizationUsed, setOptimizationUsed] = useState<boolean>(true);
  const [runs, setRuns] = useState<number>(200);

  const handleDeploy = async () => {
    await onDeploy({ sourceCode, contractName, compilerVersion, optimizationUsed, runs });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Deploy & Verify Smart Contract</DialogTitle>
          <DialogDescription>
            Optionally provide Solidity source and compiler settings to auto-verify and publish on Etherscan after deployment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source">Solidity Source Code (optional)</Label>
            <Textarea
              id="source"
              placeholder="// Paste your Solidity source here if you want Etherscan verification\n// pragma solidity ^0.8.24;\n// contract Arbitrage { ... }"
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              className="h-48"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Contract Name</Label>
              <Input
                id="name"
                placeholder="Arbitrage" 
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compiler">Compiler Version</Label>
              <Input
                id="compiler"
                placeholder="v0.8.24+commit.e11b9ed9"
                value={compilerVersion}
                onChange={(e) => setCompilerVersion(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/40">
              <div>
                <Label>Enable Optimizer</Label>
                <p className="text-xs text-muted-foreground">Recommended for production deployments</p>
              </div>
              <Switch checked={optimizationUsed} onCheckedChange={setOptimizationUsed} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="runs">Optimizer Runs</Label>
              <Input
                id="runs"
                type="number"
                min={0}
                value={runs}
                onChange={(e) => setRuns(parseInt(e.target.value || "0", 10))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeploying}>Cancel</Button>
          <Button onClick={handleDeploy} disabled={isDeploying} variant="engine">
            {isDeploying ? 'Deploying...' : 'Deploy & Verify'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

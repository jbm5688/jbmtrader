import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BotSettings {
  id: number;
  userId: number;
  isActive: boolean;
  initialAmount: string;
  primaryTimeframe: number;
  secondaryTimeframe: number;
  multiplier: number;
  maxDailyLoss: string;
  riskManagement: boolean;
}

interface TradingControlsProps {
  settings?: BotSettings;
  isActive: boolean;
  onToggle: () => void;
  onUpdateSettings: (settings: Partial<BotSettings>) => void;
}

export default function TradingControls({ 
  settings, 
  isActive, 
  onToggle, 
  onUpdateSettings 
}: TradingControlsProps) {
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState({
    initialAmount: settings?.initialAmount || "20.00",
    primaryTimeframe: settings?.primaryTimeframe || 60,
    secondaryTimeframe: settings?.secondaryTimeframe || 10,
    multiplier: settings?.multiplier || 10,
    maxDailyLoss: settings?.maxDailyLoss || "500.00",
    riskManagement: settings?.riskManagement ?? true,
  });

  const handleUpdateSettings = () => {
    onUpdateSettings(localSettings);
    toast({
      title: "Settings Updated",
      description: "Bot configuration has been saved successfully.",
    });
  };

  const handleToggle = () => {
    onToggle();
    toast({
      title: isActive ? "Bot Deactivated" : "Bot Activated",
      description: isActive 
        ? "Automated trading has been stopped." 
        : "Automated trading is now active.",
      variant: isActive ? "destructive" : "default",
    });
  };

  return (
    <Card className="bg-[#1E293B] border-[#334155]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <Settings className="w-5 h-5 mr-2 text-blue-400" />
          Trading Controls
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Automation Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="automation-toggle" className="text-sm">
            Automation Status
          </Label>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">
              {isActive ? 'Active' : 'Inactive'}
            </span>
            <Switch
              id="automation-toggle"
              checked={isActive}
              onCheckedChange={handleToggle}
            />
          </div>
        </div>

        {/* Initial Entry Amount */}
        <div className="space-y-2">
          <Label htmlFor="initial-amount" className="text-sm text-gray-400">
            Initial Entry Amount
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="initial-amount"
              type="number"
              step="0.01"
              value={localSettings.initialAmount}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                initialAmount: e.target.value 
              }))}
              className="pl-10 bg-[#334155] border-gray-600 font-mono"
              disabled={isActive}
            />
          </div>
        </div>

        {/* Primary Timeframe */}
        <div className="space-y-2">
          <Label htmlFor="primary-timeframe" className="text-sm text-gray-400">
            Primary Timeframe
          </Label>
          <Select 
            value={localSettings.primaryTimeframe.toString()} 
            onValueChange={(value) => setLocalSettings(prev => ({ 
              ...prev, 
              primaryTimeframe: parseInt(value) 
            }))}
            disabled={isActive}
          >
            <SelectTrigger className="bg-[#334155] border-gray-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1E293B] border-[#334155]">
              <SelectItem value="60">60 seconds</SelectItem>
              <SelectItem value="120">2 minutes</SelectItem>
              <SelectItem value="300">5 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Martingale Multiplier */}
        <div className="space-y-2">
          <Label htmlFor="multiplier" className="text-sm text-gray-400">
            Martingale Multiplier
          </Label>
          <Input
            id="multiplier"
            type="number"
            min="2"
            max="20"
            value={localSettings.multiplier}
            onChange={(e) => setLocalSettings(prev => ({ 
              ...prev, 
              multiplier: parseInt(e.target.value) || 10 
            }))}
            className="bg-[#334155] border-gray-600 font-mono"
            disabled={isActive}
          />
        </div>

        {/* Secondary Timeframe */}
        <div className="space-y-2">
          <Label htmlFor="secondary-timeframe" className="text-sm text-gray-400">
            Secondary Timeframe
          </Label>
          <Select 
            value={localSettings.secondaryTimeframe.toString()} 
            onValueChange={(value) => setLocalSettings(prev => ({ 
              ...prev, 
              secondaryTimeframe: parseInt(value) 
            }))}
            disabled={isActive}
          >
            <SelectTrigger className="bg-[#334155] border-gray-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1E293B] border-[#334155]">
              <SelectItem value="10">10 seconds</SelectItem>
              <SelectItem value="30">30 seconds</SelectItem>
              <SelectItem value="60">60 seconds</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Max Daily Loss */}
        <div className="space-y-2">
          <Label htmlFor="max-loss" className="text-sm text-gray-400">
            Max Daily Loss
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="max-loss"
              type="number"
              step="0.01"
              value={localSettings.maxDailyLoss}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                maxDailyLoss: e.target.value 
              }))}
              className="pl-10 bg-[#334155] border-gray-600 font-mono"
              disabled={isActive}
            />
          </div>
        </div>

        {/* Risk Management */}
        <div className="flex items-center justify-between">
          <Label htmlFor="risk-management" className="text-sm">
            Risk Management
          </Label>
          <Switch
            id="risk-management"
            checked={localSettings.riskManagement}
            onCheckedChange={(checked) => setLocalSettings(prev => ({ 
              ...prev, 
              riskManagement: checked 
            }))}
            disabled={isActive}
          />
        </div>

        {/* Update Button */}
        <div className="pt-2">
          <Button 
            onClick={handleUpdateSettings}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isActive}
          >
            Update Configuration
          </Button>
        </div>

        {/* Status Indicator */}
        <div className={`mt-4 p-3 rounded-lg ${
          isActive 
            ? 'bg-green-400/10 border border-green-400/20' 
            : 'bg-gray-400/10 border border-gray-400/20'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span className="text-sm">
              {isActive ? 'Bot is actively monitoring the market' : 'Bot is currently inactive'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

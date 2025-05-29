import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TradingEngine } from "@/lib/trading-engine";
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

export function useTradingBot(userId: number) {
  const [isActive, setIsActive] = useState(false);
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const tradingEngineRef = useRef<TradingEngine | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Initialize trading engine
  useEffect(() => {
    if (!tradingEngineRef.current) {
      tradingEngineRef.current = new TradingEngine(userId);
    }
  }, [userId]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<BotSettings>) => {
      const response = await apiRequest('POST', `/api/settings/${userId}`, newSettings);
      return response.json();
    },
    onSuccess: (data) => {
      setSettings(data);
      queryClient.invalidateQueries({ queryKey: [`/api/settings/${userId}`] });
      
      // Update trading engine settings
      if (tradingEngineRef.current) {
        tradingEngineRef.current.updateSettings(data);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
      console.error('Settings update error:', error);
    }
  });

  // Toggle bot activation
  const toggleBot = async () => {
    if (!settings) return;

    const newActiveState = !isActive;
    
    try {
      if (newActiveState) {
        // Activate bot
        if (tradingEngineRef.current) {
          tradingEngineRef.current.start();
        }
        setIsActive(true);
        
        toast({
          title: "Bot Activated",
          description: "Automated trading system is now monitoring the market.",
        });
      } else {
        // Deactivate bot
        if (tradingEngineRef.current) {
          tradingEngineRef.current.stop();
        }
        setIsActive(false);
        
        toast({
          title: "Bot Deactivated",
          description: "Automated trading has been stopped.",
          variant: "destructive",
        });
      }

      // Update settings in backend
      await updateSettingsMutation.mutateAsync({ isActive: newActiveState });
      
    } catch (error) {
      console.error('Error toggling bot:', error);
      toast({
        title: "Error",
        description: "Failed to toggle bot status",
        variant: "destructive",
      });
    }
  };

  // Emergency stop
  const emergencyStop = async () => {
    try {
      // Immediately stop the trading engine
      if (tradingEngineRef.current) {
        tradingEngineRef.current.emergencyStop();
      }
      
      setIsActive(false);
      
      // Update backend
      await updateSettingsMutation.mutateAsync({ isActive: false });
      
      // Invalidate all trade-related queries
      queryClient.invalidateQueries({ queryKey: [`/api/trades/active/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/performance/${userId}`] });
      
      toast({
        title: "Emergency Stop Activated",
        description: "All trading activities have been halted immediately.",
        variant: "destructive",
      });
      
    } catch (error) {
      console.error('Emergency stop error:', error);
      toast({
        title: "Emergency Stop Error",
        description: "Failed to execute emergency stop",
        variant: "destructive",
      });
    }
  };

  // Update settings
  const updateSettings = (newSettings: Partial<BotSettings>) => {
    if (isActive) {
      toast({
        title: "Cannot Update Settings",
        description: "Please stop the bot before changing settings.",
        variant: "destructive",
      });
      return;
    }
    
    updateSettingsMutation.mutate(newSettings);
  };

  // Risk management check
  const checkRiskLimits = async () => {
    if (!settings || !settings.riskManagement) return true;

    try {
      const response = await apiRequest('GET', `/api/performance/${userId}`);
      const performance = await response.json();
      
      const maxLoss = parseFloat(settings.maxDailyLoss);
      const currentLoss = Math.abs(Math.min(0, performance.dailyPnL));
      
      if (currentLoss >= maxLoss) {
        await emergencyStop();
        
        toast({
          title: "Risk Limit Reached",
          description: `Daily loss limit of $${maxLoss} has been reached. Bot stopped.`,
          variant: "destructive",
        });
        
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Risk check error:', error);
      return true; // Allow trading if risk check fails
    }
  };

  // Monitor active trades and handle timeouts
  useEffect(() => {
    if (!isActive || !tradingEngineRef.current) return;

    const interval = setInterval(async () => {
      // Check risk limits
      const canContinue = await checkRiskLimits();
      if (!canContinue) return;
      
      // Update trading engine with latest market data
      if (tradingEngineRef.current) {
        tradingEngineRef.current.processMarketTick();
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [isActive, settings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tradingEngineRef.current) {
        tradingEngineRef.current.stop();
      }
    };
  }, []);

  return {
    isActive,
    settings,
    toggleBot,
    updateSettings,
    emergencyStop,
    checkRiskLimits,
    isUpdating: updateSettingsMutation.isPending,
  };
}

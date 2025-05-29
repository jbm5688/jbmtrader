import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TradingChart from "@/components/trading-chart";
import TradingControls from "@/components/trading-controls";
import ActiveTrades from "@/components/active-trades";
import PerformanceStats from "@/components/performance-stats";
import MarketAnalysis from "@/components/market-analysis";
import TradingLog from "@/components/trading-log";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-websocket";
import { useTradingBot } from "@/hooks/use-trading-bot";
import { Bell, User, Activity, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BrokerConfig {
  broker: string;
  email: string;
  password: string;
  apiKey?: string;
  demo: boolean;
}

interface DashboardProps {
  brokerConfig: BrokerConfig | null;
}

export default function Dashboard({ brokerConfig }: DashboardProps) {
  const [userId] = useState(1); // Mock user ID
  const { toast } = useToast();
  const { connectionStatus, marketData, trades, signals } = useWebSocket(userId);
  const { 
    isActive, 
    settings, 
    toggleBot, 
    updateSettings, 
    emergencyStop 
  } = useTradingBot(userId);

  // Fetch initial data
  const { data: performance } = useQuery({
    queryKey: [`/api/performance/${userId}`],
    refetchInterval: 5000,
  });

  const { data: botSettings } = useQuery({
    queryKey: [`/api/settings/${userId}`],
  });

  const { data: activeTrades } = useQuery({
    queryKey: [`/api/trades/active/${userId}`],
    refetchInterval: 1000,
  });

  const { data: tradeHistory } = useQuery({
    queryKey: [`/api/trades/history/${userId}`],
    refetchInterval: 5000,
  });

  const handleEmergencyStop = () => {
    emergencyStop();
    toast({
      title: "Emergency Stop Activated",
      description: "All trading activities have been halted immediately.",
      variant: "destructive",
    });
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'disconnected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Top Navigation */}
      <nav className="bg-[#1E293B] border-b border-[#334155] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Activity className="text-blue-400 text-xl" />
              <h1 className="text-xl font-bold">BinaryBot Pro</h1>
            </div>
            <div className="h-6 w-px bg-[#334155]"></div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                connectionStatus === 'connected' ? 'bg-green-400' : 
                connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
              }`}></div>
              <span className={`text-sm ${getConnectionStatusColor()}`}>
                {connectionStatus === 'connected' ? 'Connected to Market' :
                 connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Status da Corretora */}
            <div className="bg-[#334155] rounded-lg px-4 py-2">
              <span className="text-sm text-gray-400">Corretora:</span>
              <span className="ml-2 font-semibold text-blue-400">
                {brokerConfig ? `${brokerConfig.broker.toUpperCase()} (${brokerConfig.demo ? 'DEMO' : 'REAL'})` : 'Não conectada'}
              </span>
            </div>
            
            <div className="bg-[#334155] rounded-lg px-4 py-2">
              <span className="text-sm text-gray-400">Balance:</span>
              <span className="ml-2 font-mono font-semibold text-green-400">
                {performance ? formatCurrency(5420.50 + performance.dailyPnL) : formatCurrency(5420.50)}
              </span>
            </div>
            
            <div className="bg-[#334155] rounded-lg px-4 py-2">
              <span className="text-sm text-gray-400">Win Rate:</span>
              <span className="ml-2 font-mono font-semibold text-blue-400">
                {performance ? `${performance.winRate.toFixed(1)}%` : '73.2%'}
              </span>
            </div>
            
            <Button
              onClick={handleEmergencyStop}
              className="bg-red-600 hover:bg-red-700 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Emergency Stop
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Dashboard */}
      <div className="trading-grid">
        {/* Left Column: Controls & Settings */}
        <div className="col-span-3 space-y-6">
          <TradingControls
            settings={botSettings}
            isActive={isActive}
            onToggle={toggleBot}
            onUpdateSettings={updateSettings}
          />
          <MarketAnalysis marketData={marketData} signals={signals} />
        </div>

        {/* Center Column: Chart & Trading Interface */}
        <div className="col-span-6 space-y-6">
          <div className="h-2/3">
            <TradingChart marketData={marketData} activeTrades={activeTrades} />
          </div>
          <div className="h-1/3">
            <ActiveTrades trades={activeTrades} />
          </div>
        </div>

        {/* Right Column: Statistics & Logs */}
        <div className="col-span-3 space-y-6">
          <PerformanceStats performance={performance} />
          <TradingLog trades={tradeHistory} />
          
          {/* System Alerts */}
          <div className="bg-[#1E293B] rounded-xl p-6 border border-[#334155]">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
              System Alerts
            </h2>
            
            <div className="space-y-2">
              {connectionStatus !== 'connected' && (
                <div className="bg-red-400/20 border border-red-400 rounded p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400">⚠ Connection Issue</span>
                    <span className="text-xs text-gray-400">Now</span>
                  </div>
                  <div className="text-xs text-gray-300 mt-1">Market data connection lost</div>
                </div>
              )}
              
              {performance && performance.dailyPnL < -100 && (
                <div className="bg-yellow-400/20 border border-yellow-400 rounded p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-400">⚠ High Daily Loss</span>
                    <span className="text-xs text-gray-400">Recent</span>
                  </div>
                  <div className="text-xs text-gray-300 mt-1">Consider reducing position sizes</div>
                </div>
              )}
              
              {isActive && (
                <div className="bg-green-400/20 border border-green-400 rounded p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-green-400">✓ Bot Active</span>
                    <span className="text-xs text-gray-400">Now</span>
                  </div>
                  <div className="text-xs text-gray-300 mt-1">Automated trading enabled</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

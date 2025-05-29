import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, Activity } from "lucide-react";

interface Performance {
  dailyPnL: number;
  winRate: number;
  totalTrades: number;
  wins: number;
  losses: number;
  activeTrades: number;
  avgTrade: number;
}

interface PerformanceStatsProps {
  performance?: Performance;
}

export default function PerformanceStats({ performance }: PerformanceStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const winRate = performance?.winRate || 0;
  const dailyPnL = performance?.dailyPnL || 0;
  const totalTrades = performance?.totalTrades || 0;
  const wins = performance?.wins || 0;
  const losses = performance?.losses || 0;
  const avgTrade = performance?.avgTrade || 0;

  return (
    <Card className="bg-[#1E293B] border-[#334155]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-400" />
          Performance
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-[#334155] rounded-lg">
            <div className={`text-2xl font-bold ${
              dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {dailyPnL >= 0 ? '+' : ''}{formatCurrency(dailyPnL)}
            </div>
            <div className="text-xs text-gray-400">Today's P&L</div>
          </div>
          
          <div className="text-center p-3 bg-[#334155] rounded-lg">
            <div className="text-2xl font-bold text-blue-400">
              {formatNumber(totalTrades)}
            </div>
            <div className="text-xs text-gray-400">Total Trades</div>
          </div>
        </div>

        {/* Win Rate Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 flex items-center">
              <Target className="w-4 h-4 mr-1" />
              Win Rate
            </span>
            <span className="font-semibold text-blue-400">
              {winRate.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={winRate} 
            className="h-3 bg-gray-700"
          />
        </div>

        {/* Detailed Stats */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1 text-green-400" />
              Wins
            </span>
            <span className="text-green-400 font-semibold">{wins}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400 flex items-center">
              <TrendingDown className="w-4 h-4 mr-1 text-red-400" />
              Losses
            </span>
            <span className="text-red-400 font-semibold">{losses}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Avg. Trade</span>
            <span className={`font-mono font-semibold ${
              avgTrade >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrency(avgTrade)}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Success Ratio</span>
            <span className="font-semibold">
              {totalTrades > 0 ? `${wins}:${losses}` : '0:0'}
            </span>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="pt-4 border-t border-gray-700 space-y-3">
          <h3 className="text-sm font-medium">Performance Indicators</h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Daily Target</span>
              <span className={dailyPnL >= 100 ? 'text-green-400' : 'text-yellow-400'}>
                {dailyPnL >= 100 ? '✓ Achieved' : `${formatCurrency(100 - dailyPnL)} to go`}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Win Rate Target</span>
              <span className={winRate >= 70 ? 'text-green-400' : 'text-yellow-400'}>
                {winRate >= 70 ? '✓ Above 70%' : 'Below target'}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Risk Level</span>
              <span className={
                Math.abs(dailyPnL) <= 250 ? 'text-green-400' : 
                Math.abs(dailyPnL) <= 400 ? 'text-yellow-400' : 'text-red-400'
              }>
                {Math.abs(dailyPnL) <= 250 ? 'Low' : 
                 Math.abs(dailyPnL) <= 400 ? 'Medium' : 'High'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="bg-[#334155] p-2 rounded text-center">
            <div className="text-sm font-semibold">{((wins / Math.max(totalTrades, 1)) * 100).toFixed(0)}%</div>
            <div className="text-xs text-gray-400">Win %</div>
          </div>
          
          <div className="bg-[#334155] p-2 rounded text-center">
            <div className="text-sm font-semibold">{totalTrades}</div>
            <div className="text-xs text-gray-400">Today</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

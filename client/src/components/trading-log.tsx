import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Clock, TrendingUp, TrendingDown } from "lucide-react";

interface Trade {
  id: number;
  userId: number;
  pair: string;
  direction: string;
  entryAmount: string;
  timeframe: number;
  entryPrice?: string;
  exitPrice?: string;
  result?: string;
  payout?: string;
  isActive: boolean;
  isMartingale: boolean;
  parentTradeId?: number;
  entryTime: string;
  exitTime?: string;
}

interface TradingLogProps {
  trades: Trade[];
}

export default function TradingLog({ trades }: TradingLogProps) {
  const completedTrades = trades?.filter(trade => !trade.isActive && trade.result) || [];
  const recentTrades = completedTrades.slice(0, 20); // Show last 20 trades

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (timeframe: number) => {
    if (timeframe >= 60) {
      const mins = Math.floor(timeframe / 60);
      const secs = timeframe % 60;
      return `${mins}m${secs > 0 ? ` ${secs}s` : ''}`;
    }
    return `${timeframe}s`;
  };

  const calculatePnL = (trade: Trade) => {
    if (!trade.result) return 0;
    
    if (trade.result === 'WIN') {
      return parseFloat(trade.payout || '0');
    } else {
      return -parseFloat(trade.entryAmount);
    }
  };

  const getTradeTypeIcon = (trade: Trade) => {
    if (trade.isMartingale) {
      return <TrendingUp className="w-3 h-3 text-yellow-400" />;
    }
    return trade.direction === 'CALL' ? 
      <ArrowUpRight className="w-3 h-3 text-green-400" /> : 
      <ArrowDownRight className="w-3 h-3 text-red-400" />;
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'WIN': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'LOSS': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  return (
    <Card className="bg-[#1E293B] border-[#334155] flex-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-400" />
          Trading Log
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-96 custom-scrollbar">
          {recentTrades.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Completed Trades</p>
              <p className="text-sm">Trade history will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTrades.map((trade) => {
                const pnl = calculatePnL(trade);
                
                return (
                  <div
                    key={trade.id}
                    className={`p-3 rounded-lg border-l-2 ${
                      trade.result === 'WIN' 
                        ? 'border-l-green-400 bg-green-400/5' 
                        : 'border-l-red-400 bg-red-400/5'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 text-xs font-mono">
                          {formatTime(trade.entryTime)}
                        </span>
                        <div className="flex items-center space-x-1">
                          {getTradeTypeIcon(trade)}
                          <span className="font-semibold text-sm">{trade.pair}</span>
                          <span className="text-xs text-gray-400">{trade.direction}</span>
                        </div>
                        {trade.isMartingale && (
                          <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 text-xs">
                            Martingale
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className={`font-semibold text-sm ${
                          pnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getResultColor(trade.result || '')}`}
                        >
                          {trade.result}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                      <div>
                        <span>Entry: </span>
                        <span className="font-mono">{formatCurrency(trade.entryAmount)}</span>
                      </div>
                      <div>
                        <span>Price: </span>
                        <span className="font-mono">
                          {trade.entryPrice} → {trade.exitPrice}
                        </span>
                      </div>
                      <div>
                        <span>Duration: </span>
                        <span className="font-mono">{formatDuration(trade.timeframe)}</span>
                      </div>
                    </div>

                    {/* Additional details for martingale trades */}
                    {trade.isMartingale && (
                      <div className="mt-2 text-xs text-yellow-400 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Recovery trade - {((parseFloat(trade.entryAmount) / 20) || 1).toFixed(0)}x multiplier applied
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Log Summary */}
        {recentTrades.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-green-400">
                  {recentTrades.filter(t => t.result === 'WIN').length}
                </div>
                <div className="text-xs text-gray-400">Wins</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-red-400">
                  {recentTrades.filter(t => t.result === 'LOSS').length}
                </div>
                <div className="text-xs text-gray-400">Losses</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-400">
                  {((recentTrades.filter(t => t.result === 'WIN').length / recentTrades.length) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">Win Rate</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, ArrowDownRight, Clock, DollarSign } from "lucide-react";

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

interface ActiveTradesProps {
  trades: Trade[];
}

export default function ActiveTrades({ trades }: ActiveTradesProps) {
  const activeTrades = trades?.filter(trade => trade.isActive) || [];

  const calculateTimeRemaining = (entryTime: string, timeframe: number) => {
    const entry = new Date(entryTime).getTime();
    const now = Date.now();
    const elapsed = (now - entry) / 1000; // seconds elapsed
    const remaining = Math.max(0, timeframe - elapsed);
    return remaining;
  };

  const calculateProgress = (entryTime: string, timeframe: number) => {
    const entry = new Date(entryTime).getTime();
    const now = Date.now();
    const elapsed = (now - entry) / 1000;
    const progress = Math.min(100, (elapsed / timeframe) * 100);
    return progress;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const calculatePotentialPayout = (entryAmount: string) => {
    const amount = parseFloat(entryAmount);
    return amount * 0.85; // 85% payout rate
  };

  return (
    <Card className="bg-[#1E293B] border-[#334155] h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-400" />
          Active Trades
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {activeTrades.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Active Trades</p>
            <p className="text-sm">Waiting for trading signals...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTrades.map((trade) => {
              const timeRemaining = calculateTimeRemaining(trade.entryTime, trade.timeframe);
              const progress = calculateProgress(trade.entryTime, trade.timeframe);
              const potentialPayout = calculatePotentialPayout(trade.entryAmount);
              
              return (
                <div
                  key={trade.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    trade.isMartingale 
                      ? 'border-l-yellow-400 bg-yellow-400/5' 
                      : 'border-l-blue-400 bg-blue-400/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm">{trade.pair}</span>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                          trade.direction === 'CALL' 
                            ? 'bg-green-400/20 text-green-400' 
                            : 'bg-red-400/20 text-red-400'
                        }`}>
                          {trade.direction === 'CALL' ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          <span>{trade.direction}</span>
                        </div>
                      </div>
                      
                      {trade.isMartingale && (
                        <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded">
                          Martingale
                        </span>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-400">
                        +{formatCurrency(potentialPayout)}
                      </div>
                      <div className="text-xs text-gray-400">85% payout</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-400">Entry:</span>
                      <div className="font-mono font-medium">
                        {formatCurrency(trade.entryAmount)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Price:</span>
                      <div className="font-mono font-medium">
                        {trade.entryPrice || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Time Left:</span>
                      <div className="font-mono font-medium text-yellow-400">
                        {formatTime(timeRemaining)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Progress</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={progress} 
                      className="h-2 bg-gray-700"
                    />
                  </div>

                  {/* Entry Time */}
                  <div className="mt-2 text-xs text-gray-400">
                    Entered at {new Date(trade.entryTime).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {activeTrades.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Active Trades:</span>
              <span className="font-semibold">{activeTrades.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-400">Total Risk:</span>
              <span className="font-mono font-semibold text-red-400">
                {formatCurrency(
                  activeTrades.reduce((sum, trade) => sum + parseFloat(trade.entryAmount), 0)
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-400">Potential Profit:</span>
              <span className="font-mono font-semibold text-green-400">
                {formatCurrency(
                  activeTrades.reduce((sum, trade) => sum + calculatePotentialPayout(trade.entryAmount), 0)
                )}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

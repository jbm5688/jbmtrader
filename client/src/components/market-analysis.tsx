import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Activity, CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface MarketData {
  id: number;
  pair: string;
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: number;
}

interface Signal {
  id: number;
  pair: string;
  direction: string;
  strength: number;
  indicators: string;
  timestamp: string;
}

interface MarketAnalysisProps {
  marketData: MarketData[];
  signals: Signal[];
}

export default function MarketAnalysis({ marketData, signals }: MarketAnalysisProps) {
  // Get latest market data for analysis
  const latestData = marketData.find(data => data.pair === 'EUR/USD');
  const latestSignal = signals.find(signal => signal.pair === 'EUR/USD');
  
  // Calculate trend based on recent price movement
  const calculateTrend = (data: MarketData) => {
    const open = parseFloat(data.open);
    const close = parseFloat(data.close);
    const change = ((close - open) / open) * 100;
    
    if (change > 0.01) return { direction: 'BULLISH', color: 'text-green-400', icon: TrendingUp };
    if (change < -0.01) return { direction: 'BEARISH', color: 'text-red-400', icon: TrendingDown };
    return { direction: 'NEUTRAL', color: 'text-yellow-400', icon: Activity };
  };

  // Mock technical indicators (in production, these would be calculated from real data)
  const mockIndicators = {
    rsi: 67.2,
    macd: 'Bullish',
    volume: 'Moderate',
    support: 'Clear',
    bollinger: 'Oversold',
    stochastic: 74.5,
    ema: 'Above',
    fibonacci: '61.8% Retracement'
  };

  const trend = latestData ? calculateTrend(latestData) : { direction: 'NEUTRAL', color: 'text-yellow-400', icon: Activity };
  const signalStrength = latestSignal?.strength || 65;

  // Determine confluence score based on indicators
  const calculateConfluence = () => {
    let score = 0;
    if (mockIndicators.rsi > 30 && mockIndicators.rsi < 70) score += 20;
    if (mockIndicators.macd === 'Bullish') score += 25;
    if (mockIndicators.volume === 'High' || mockIndicators.volume === 'Moderate') score += 15;
    if (mockIndicators.support === 'Clear') score += 20;
    if (mockIndicators.stochastic > 20 && mockIndicators.stochastic < 80) score += 20;
    return Math.min(100, score);
  };

  const confluenceScore = calculateConfluence();

  const getIndicatorStatus = (indicator: string, value: string | number) => {
    // Determine if indicator is positive, negative, or neutral
    if (typeof value === 'number') {
      if (indicator === 'rsi') {
        if (value > 70) return { status: 'negative', icon: XCircle, color: 'text-red-400' };
        if (value < 30) return { status: 'negative', icon: XCircle, color: 'text-red-400' };
        return { status: 'positive', icon: CheckCircle, color: 'text-green-400' };
      }
      if (indicator === 'stochastic') {
        if (value > 80) return { status: 'warning', icon: AlertCircle, color: 'text-yellow-400' };
        if (value < 20) return { status: 'warning', icon: AlertCircle, color: 'text-yellow-400' };
        return { status: 'positive', icon: CheckCircle, color: 'text-green-400' };
      }
    }

    // String-based indicators
    if (value === 'Bullish' || value === 'Clear' || value === 'High' || value === 'Above') {
      return { status: 'positive', icon: CheckCircle, color: 'text-green-400' };
    }
    if (value === 'Bearish' || value === 'Weak' || value === 'Low' || value === 'Below') {
      return { status: 'negative', icon: XCircle, color: 'text-red-400' };
    }
    return { status: 'warning', icon: AlertCircle, color: 'text-yellow-400' };
  };

  return (
    <Card className="bg-[#1E293B] border-[#334155]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-400" />
          Market Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Trend */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Overall Trend</span>
          <Badge variant="outline" className={`${trend.color} border-current`}>
            <trend.icon className="w-3 h-3 mr-1" />
            {trend.direction}
          </Badge>
        </div>

        {/* Signal Strength */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Signal Strength</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-400 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${signalStrength}%` }}
                ></div>
              </div>
              <span className="text-xs font-mono w-8">{signalStrength}%</span>
            </div>
          </div>
        </div>

        {/* Confluence Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Confluence Score</span>
            <span className={`font-semibold ${
              confluenceScore >= 80 ? 'text-green-400' : 
              confluenceScore >= 60 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {confluenceScore}/100
            </span>
          </div>
          <Progress value={confluenceScore} className="h-2 bg-gray-700" />
        </div>

        {/* Technical Indicators */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Confluence Indicators</h3>
          
          <div className="space-y-2">
            {Object.entries(mockIndicators).map(([key, value]) => {
              const indicator = getIndicatorStatus(key, value);
              const IconComponent = indicator.icon;
              
              return (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={indicator.color}>
                      {typeof value === 'number' ? value.toFixed(1) : value}
                    </span>
                    <IconComponent className={`w-3 h-3 ${indicator.color}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Market Sentiment */}
        <div className="pt-4 border-t border-gray-700">
          <h3 className="text-sm font-medium mb-3">Market Sentiment</h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Volume Profile</span>
              <span className="text-yellow-400">Moderate</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Volatility</span>
              <span className="text-green-400">Normal</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Market Phase</span>
              <span className="text-blue-400">Trending</span>
            </div>
          </div>
        </div>

        {/* Trade Recommendation */}
        <div className={`mt-4 p-3 rounded-lg border ${
          confluenceScore >= 75 
            ? 'bg-green-400/10 border-green-400/30' 
            : confluenceScore >= 50 
            ? 'bg-yellow-400/10 border-yellow-400/30'
            : 'bg-red-400/10 border-red-400/30'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {confluenceScore >= 75 ? 'Strong Signal' : 
               confluenceScore >= 50 ? 'Moderate Signal' : 'Weak Signal'}
            </span>
            <span className={`text-sm font-semibold ${
              confluenceScore >= 75 ? 'text-green-400' : 
              confluenceScore >= 50 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {confluenceScore >= 75 ? 'ENTER' : 
               confluenceScore >= 50 ? 'WAIT' : 'AVOID'}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {confluenceScore >= 75 ? 'Multiple indicators confirm trend direction' : 
             confluenceScore >= 50 ? 'Mixed signals, wait for clearer confirmation' : 
             'Insufficient confluence for reliable entry'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

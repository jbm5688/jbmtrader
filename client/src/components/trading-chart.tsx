import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock } from "lucide-react";

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

interface Trade {
  id: number;
  pair: string;
  direction: string;
  entryAmount: string;
  timeframe: number;
  entryPrice?: string;
  isActive: boolean;
  isMartingale: boolean;
  entryTime: string;
}

interface TradingChartProps {
  marketData: MarketData[];
  activeTrades: Trade[];
}

export default function TradingChart({ marketData, activeTrades }: TradingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPair, setSelectedPair] = useState("EUR/USD");
  const [timeframe, setTimeframe] = useState("1M");
  const [chartData, setChartData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    if (marketData.length > 0) {
      const pairData = marketData.filter(data => data.pair === selectedPair);
      const prices = pairData.map(data => parseFloat(data.close));
      const timeLabels = pairData.map(data => 
        new Date(data.timestamp).toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      );
      
      setChartData(prices);
      setLabels(timeLabels);
    }
  }, [marketData, selectedPair]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const { width, height } = canvas;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate price range
    const minPrice = Math.min(...chartData);
    const maxPrice = Math.max(...chartData);
    const priceRange = maxPrice - minPrice;

    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Draw price line
    if (chartData.length > 1) {
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.beginPath();

      chartData.forEach((price, index) => {
        const x = padding + (chartWidth / (chartData.length - 1)) * index;
        const y = height - padding - ((price - minPrice) / priceRange) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Fill area under line
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineTo(width - padding, height - padding);
      ctx.lineTo(padding, height - padding);
      ctx.closePath();
      ctx.fill();
    }

    // Draw entry points for active trades
    activeTrades.forEach((trade) => {
      if (trade.pair === selectedPair && trade.entryPrice) {
        const entryPrice = parseFloat(trade.entryPrice);
        const y = height - padding - ((entryPrice - minPrice) / priceRange) * chartHeight;
        
        ctx.fillStyle = trade.direction === 'CALL' ? '#10B981' : '#EF4444';
        ctx.beginPath();
        ctx.arc(width - padding - 20, y, 6, 0, 2 * Math.PI);
        ctx.fill();

        // Add label
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.fillText(trade.direction, width - padding - 15, y - 10);
      }
    });

    // Draw price labels
    ctx.fillStyle = '#94A3B8';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const price = maxPrice - (priceRange / 5) * i;
      const y = padding + (chartHeight / 5) * i;
      ctx.fillText(price.toFixed(5), padding - 10, y + 4);
    }

    // Draw time labels
    ctx.textAlign = 'center';
    const labelStep = Math.max(1, Math.floor(labels.length / 6));
    for (let i = 0; i < labels.length; i += labelStep) {
      const x = padding + (chartWidth / (chartData.length - 1)) * i;
      ctx.fillText(labels[i], x, height - 10);
    }

  }, [chartData, labels, selectedPair, activeTrades]);

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1] : 0;
  const previousPrice = chartData.length > 1 ? chartData[chartData.length - 2] : currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice !== 0 ? (priceChange / previousPrice) * 100 : 0;

  return (
    <Card className="bg-[#1E293B] border-[#334155] h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
            {selectedPair} - Binary Options
          </CardTitle>
          <div className="flex items-center space-x-4">
            <Select value={selectedPair} onValueChange={setSelectedPair}>
              <SelectTrigger className="w-32 bg-[#334155] border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-[#334155]">
                <SelectItem value="EUR/USD">EUR/USD</SelectItem>
                <SelectItem value="GBP/USD">GBP/USD</SelectItem>
                <SelectItem value="USD/JPY">USD/JPY</SelectItem>
                <SelectItem value="USD/CHF">USD/CHF</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex bg-[#334155] rounded-md">
              <Button
                variant={timeframe === "1M" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeframe("1M")}
                className="px-3 py-1 text-xs rounded-l-md rounded-r-none"
              >
                1M
              </Button>
              <Button
                variant={timeframe === "5M" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeframe("5M")}
                className="px-3 py-1 text-xs rounded-none"
              >
                5M
              </Button>
              <Button
                variant={timeframe === "15M" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeframe("15M")}
                className="px-3 py-1 text-xs rounded-r-md rounded-l-none"
              >
                15M
              </Button>
            </div>
          </div>
        </div>
        
        {/* Price Info */}
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Price:</span>
            <span className="font-mono font-semibold text-lg">
              {currentPrice.toFixed(5)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Change:</span>
            <span className={`font-mono font-semibold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(5)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">
              Last Update: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="h-[calc(100%-8rem)]">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ maxHeight: '400px' }}
        />
      </CardContent>
    </Card>
  );
}

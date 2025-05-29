import { apiRequest } from "@/lib/queryClient";
import { TechnicalAnalysis } from "@/lib/technical-analysis";

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

interface Signal {
  pair: string;
  direction: 'CALL' | 'PUT';
  strength: number;
  confluence: number;
  indicators: {
    rsi: number;
    macd: string;
    trend: string;
    support: string;
    volume: string;
  };
}

export class TradingEngine {
  private userId: number;
  private isRunning: boolean = false;
  private settings: BotSettings | null = null;
  private activeTrades: Map<number, Trade> = new Map();
  private marketData: Map<string, MarketData[]> = new Map();
  private technicalAnalysis: TechnicalAnalysis;
  private lastProcessedTime: number = 0;
  private emergencyStopTriggered: boolean = false;

  constructor(userId: number) {
    this.userId = userId;
    this.technicalAnalysis = new TechnicalAnalysis();
    this.initializeEngine();
  }

  private async initializeEngine() {
    try {
      // Load initial settings
      const response = await apiRequest('GET', `/api/settings/${this.userId}`);
      this.settings = await response.json();
      
      // Load active trades
      const tradesResponse = await apiRequest('GET', `/api/trades/active/${this.userId}`);
      const trades = await tradesResponse.json();
      
      trades.forEach((trade: Trade) => {
        this.activeTrades.set(trade.id, trade);
      });
      
      console.log('Trading engine initialized for user:', this.userId);
    } catch (error) {
      console.error('Failed to initialize trading engine:', error);
    }
  }

  public start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.emergencyStopTriggered = false;
    console.log('Trading engine started');
  }

  public stop() {
    this.isRunning = false;
    console.log('Trading engine stopped');
  }

  public emergencyStop() {
    this.isRunning = false;
    this.emergencyStopTriggered = true;
    
    // Close all active trades immediately
    this.activeTrades.forEach(async (trade) => {
      try {
        await this.closeTrade(trade.id, 'EMERGENCY_STOP');
      } catch (error) {
        console.error('Error closing trade during emergency stop:', error);
      }
    });
    
    console.log('Emergency stop activated - all trades closed');
  }

  public updateSettings(newSettings: BotSettings) {
    this.settings = newSettings;
    console.log('Trading engine settings updated');
  }

  public addMarketData(data: MarketData) {
    const pair = data.pair;
    
    if (!this.marketData.has(pair)) {
      this.marketData.set(pair, []);
    }
    
    const pairData = this.marketData.get(pair)!;
    pairData.push(data);
    
    // Keep only last 100 data points
    if (pairData.length > 100) {
      pairData.shift();
    }
    
    // Sort by timestamp
    pairData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public async processMarketTick() {
    if (!this.isRunning || this.emergencyStopTriggered || !this.settings) return;

    const now = Date.now();
    
    // Throttle processing to once per second
    if (now - this.lastProcessedTime < 1000) return;
    this.lastProcessedTime = now;

    try {
      // Check risk limits
      const canContinue = await this.checkRiskLimits();
      if (!canContinue) {
        this.emergencyStop();
        return;
      }

      // Update active trades
      await this.updateActiveTrades();
      
      // Look for new trading opportunities
      await this.scanForTradingSignals();
      
      // Process reversal opportunities
      await this.processReversalLogic();
      
    } catch (error) {
      console.error('Error in market tick processing:', error);
    }
  }

  private async checkRiskLimits(): Promise<boolean> {
    if (!this.settings?.riskManagement) return true;

    try {
      const response = await apiRequest('GET', `/api/performance/${this.userId}`);
      const performance = await response.json();
      
      const maxLoss = parseFloat(this.settings.maxDailyLoss);
      const currentLoss = Math.abs(Math.min(0, performance.dailyPnL));
      
      return currentLoss < maxLoss;
    } catch (error) {
      console.error('Risk limit check failed:', error);
      return true; // Continue trading if check fails
    }
  }

  private async updateActiveTrades() {
    const tradesResponse = await apiRequest('GET', `/api/trades/active/${this.userId}`);
    const currentTrades = await tradesResponse.json();
    
    // Update local cache
    this.activeTrades.clear();
    currentTrades.forEach((trade: Trade) => {
      this.activeTrades.set(trade.id, trade);
    });

    // Check for trades that need to be closed
    for (const [tradeId, trade] of this.activeTrades) {
      const entryTime = new Date(trade.entryTime).getTime();
      const elapsed = (Date.now() - entryTime) / 1000;
      
      if (elapsed >= trade.timeframe) {
        await this.closeTrade(tradeId, this.determineTradeResult(trade));
      }
    }
  }

  private async scanForTradingSignals() {
    const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF'];
    
    for (const pair of pairs) {
      const signal = await this.analyzeMarket(pair);
      
      if (signal && this.shouldEnterTrade(signal)) {
        await this.executeTrade(signal);
      }
    }
  }

  private async analyzeMarket(pair: string): Promise<Signal | null> {
    const pairData = this.marketData.get(pair);
    if (!pairData || pairData.length < 20) return null;

    try {
      // Get technical analysis
      const analysis = this.technicalAnalysis.analyze(pairData);
      
      // Calculate confluence score
      const confluence = this.calculateConfluence(analysis);
      
      if (confluence >= 70) { // Minimum 70% confluence required
        const signal: Signal = {
          pair,
          direction: analysis.trend.direction === 'BULLISH' ? 'CALL' : 'PUT',
          strength: analysis.strength,
          confluence,
          indicators: {
            rsi: analysis.rsi,
            macd: analysis.macd,
            trend: analysis.trend.direction,
            support: analysis.supportResistance.level,
            volume: analysis.volume.status
          }
        };

        // Create signal record
        await apiRequest('POST', '/api/signals', {
          pair: signal.pair,
          direction: signal.direction,
          strength: signal.strength,
          indicators: JSON.stringify(signal.indicators)
        });

        return signal;
      }
    } catch (error) {
      console.error('Error analyzing market for', pair, error);
    }

    return null;
  }

  private calculateConfluence(analysis: any): number {
    let score = 0;
    
    // RSI confluence (20 points)
    if (analysis.rsi > 30 && analysis.rsi < 70) score += 20;
    else if (analysis.rsi <= 30 || analysis.rsi >= 70) score += 10; // Oversold/Overbought can be good for reversals
    
    // MACD confluence (25 points)
    if (analysis.macd === 'BULLISH' || analysis.macd === 'BEARISH') score += 25;
    
    // Volume confluence (15 points)
    if (analysis.volume.status === 'HIGH') score += 15;
    else if (analysis.volume.status === 'MODERATE') score += 10;
    
    // Support/Resistance confluence (20 points)
    if (analysis.supportResistance.level === 'STRONG') score += 20;
    else if (analysis.supportResistance.level === 'MODERATE') score += 10;
    
    // Trend strength confluence (20 points)
    if (analysis.strength >= 80) score += 20;
    else if (analysis.strength >= 60) score += 15;
    else if (analysis.strength >= 40) score += 10;
    
    return Math.min(100, score);
  }

  private shouldEnterTrade(signal: Signal): boolean {
    if (!this.settings) return false;
    
    // Check if we already have active trades for this pair
    const pairTrades = Array.from(this.activeTrades.values())
      .filter(trade => trade.pair === signal.pair);
    
    if (pairTrades.length >= 2) return false; // Max 2 trades per pair
    
    // Check confluence threshold
    if (signal.confluence < 75) return false;
    
    // Check signal strength
    if (signal.strength < 70) return false;
    
    return true;
  }

  private async executeTrade(signal: Signal) {
    if (!this.settings) return;

    try {
      const latestData = this.getLatestMarketData(signal.pair);
      if (!latestData) return;

      const trade = {
        userId: this.userId,
        pair: signal.pair,
        direction: signal.direction,
        entryAmount: this.settings.initialAmount,
        timeframe: this.settings.primaryTimeframe,
        entryPrice: latestData.close,
        isActive: true,
        isMartingale: false
      };

      const response = await apiRequest('POST', '/api/trades', trade);
      const newTrade = await response.json();
      
      this.activeTrades.set(newTrade.id, newTrade);
      
      console.log('Trade executed:', newTrade);
    } catch (error) {
      console.error('Error executing trade:', error);
    }
  }

  private async processReversalLogic() {
    for (const [tradeId, trade] of this.activeTrades) {
      // Skip if this is already a martingale trade
      if (trade.isMartingale) continue;
      
      const entryTime = new Date(trade.entryTime).getTime();
      const elapsed = (Date.now() - entryTime) / 1000;
      
      // Check if we're at 31 seconds (reversal detection point)
      if (elapsed >= 31 && elapsed < 35) { // 4-second window for reversal check
        const shouldReverse = await this.detectReversal(trade);
        
        if (shouldReverse) {
          await this.executeMartingaleTrade(trade);
        }
      }
    }
  }

  private async detectReversal(parentTrade: Trade): Promise<boolean> {
    const latestData = this.getLatestMarketData(parentTrade.pair);
    if (!latestData || !parentTrade.entryPrice) return false;

    const entryPrice = parseFloat(parentTrade.entryPrice);
    const currentPrice = parseFloat(latestData.close);
    
    // Check if price is moving against our position
    if (parentTrade.direction === 'CALL' && currentPrice < entryPrice) {
      return true; // Price going down when we expected up
    } else if (parentTrade.direction === 'PUT' && currentPrice > entryPrice) {
      return true; // Price going up when we expected down
    }
    
    return false;
  }

  private async executeMartingaleTrade(parentTrade: Trade) {
    if (!this.settings) return;

    try {
      const latestData = this.getLatestMarketData(parentTrade.pair);
      if (!latestData) return;

      // Calculate martingale amount (10x multiplier)
      const martingaleAmount = parseFloat(this.settings.initialAmount) * this.settings.multiplier;

      // Execute opposite direction trade
      const oppositeDirection = parentTrade.direction === 'CALL' ? 'PUT' : 'CALL';

      const martingaleTrade = {
        userId: this.userId,
        pair: parentTrade.pair,
        direction: oppositeDirection,
        entryAmount: martingaleAmount.toFixed(2),
        timeframe: this.settings.secondaryTimeframe, // 10 seconds
        entryPrice: latestData.close,
        isActive: true,
        isMartingale: true,
        parentTradeId: parentTrade.id
      };

      const response = await apiRequest('POST', '/api/trades', martingaleTrade);
      const newTrade = await response.json();
      
      this.activeTrades.set(newTrade.id, newTrade);
      
      console.log('Martingale trade executed:', newTrade);
    } catch (error) {
      console.error('Error executing martingale trade:', error);
    }
  }

  private async closeTrade(tradeId: number, result: string) {
    try {
      const trade = this.activeTrades.get(tradeId);
      if (!trade) return;

      const latestData = this.getLatestMarketData(trade.pair);
      const exitPrice = latestData?.close || trade.entryPrice;
      
      // Calculate payout (85% for winning trades)
      let payout = '0';
      if (result === 'WIN') {
        payout = (parseFloat(trade.entryAmount) * 0.85).toFixed(2);
      }

      const updates = {
        isActive: false,
        result,
        exitPrice,
        payout,
        exitTime: new Date().toISOString()
      };

      await apiRequest('PUT', `/api/trades/${tradeId}`, updates);
      this.activeTrades.delete(tradeId);
      
      console.log('Trade closed:', tradeId, result);
    } catch (error) {
      console.error('Error closing trade:', error);
    }
  }

  private determineTradeResult(trade: Trade): string {
    const latestData = this.getLatestMarketData(trade.pair);
    if (!latestData || !trade.entryPrice) return 'LOSS';

    const entryPrice = parseFloat(trade.entryPrice);
    const exitPrice = parseFloat(latestData.close);
    
    if (trade.direction === 'CALL') {
      return exitPrice > entryPrice ? 'WIN' : 'LOSS';
    } else {
      return exitPrice < entryPrice ? 'WIN' : 'LOSS';
    }
  }

  private getLatestMarketData(pair: string): MarketData | null {
    const pairData = this.marketData.get(pair);
    if (!pairData || pairData.length === 0) return null;
    
    return pairData[pairData.length - 1];
  }

  // Public methods for external access
  public getActiveTrades(): Trade[] {
    return Array.from(this.activeTrades.values());
  }

  public getEngineStatus() {
    return {
      isRunning: this.isRunning,
      emergencyStop: this.emergencyStopTriggered,
      activeTradesCount: this.activeTrades.size,
      settings: this.settings
    };
  }
}

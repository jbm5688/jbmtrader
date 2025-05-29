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

interface TechnicalIndicators {
  rsi: number;
  macd: string;
  trend: {
    direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    strength: number;
  };
  strength: number;
  volume: {
    status: 'HIGH' | 'MODERATE' | 'LOW';
    average: number;
    current: number;
  };
  supportResistance: {
    level: 'STRONG' | 'MODERATE' | 'WEAK';
    support: number;
    resistance: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    position: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
  };
  stochastic: {
    k: number;
    d: number;
    signal: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
  };
  ema: {
    short: number;
    long: number;
    signal: 'ABOVE' | 'BELOW' | 'CROSSING';
  };
}

export class TechnicalAnalysis {
  constructor() {}

  public analyze(data: MarketData[]): TechnicalIndicators {
    if (data.length < 20) {
      throw new Error('Insufficient data for technical analysis');
    }

    const closes = data.map(d => parseFloat(d.close));
    const highs = data.map(d => parseFloat(d.high));
    const lows = data.map(d => parseFloat(d.low));
    const volumes = data.map(d => d.volume);

    return {
      rsi: this.calculateRSI(closes),
      macd: this.calculateMACD(closes),
      trend: this.calculateTrend(closes),
      strength: this.calculateTrendStrength(closes),
      volume: this.analyzeVolume(volumes),
      supportResistance: this.findSupportResistance(highs, lows, closes),
      bollinger: this.calculateBollingerBands(closes),
      stochastic: this.calculateStochastic(highs, lows, closes),
      ema: this.calculateEMA(closes)
    };
  }

  private calculateRSI(closes: number[], period: number = 14): number {
    if (closes.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate RSI for subsequent periods
    for (let i = period + 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      avgGain = ((avgGain * (period - 1)) + gain) / period;
      avgLoss = ((avgLoss * (period - 1)) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(closes: number[]): string {
    const ema12 = this.exponentialMovingAverage(closes, 12);
    const ema26 = this.exponentialMovingAverage(closes, 26);
    
    if (ema12.length === 0 || ema26.length === 0) return 'NEUTRAL';
    
    const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
    const previousMacdLine = ema12.length > 1 && ema26.length > 1 
      ? ema12[ema12.length - 2] - ema26[ema26.length - 2] 
      : macdLine;
    
    if (macdLine > 0 && macdLine > previousMacdLine) return 'BULLISH';
    if (macdLine < 0 && macdLine < previousMacdLine) return 'BEARISH';
    
    return 'NEUTRAL';
  }

  private calculateTrend(closes: number[]): { direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; strength: number } {
    if (closes.length < 20) {
      return { direction: 'NEUTRAL', strength: 0 };
    }

    // Use linear regression to determine trend
    const n = Math.min(20, closes.length);
    const recentCloses = closes.slice(-n);
    
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += recentCloses[i];
      sumXY += i * recentCloses[i];
      sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared for trend strength
    const meanY = sumY / n;
    let totalSumSquares = 0;
    let residualSumSquares = 0;
    
    for (let i = 0; i < n; i++) {
      const predictedY = slope * i + intercept;
      totalSumSquares += Math.pow(recentCloses[i] - meanY, 2);
      residualSumSquares += Math.pow(recentCloses[i] - predictedY, 2);
    }
    
    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    const strength = Math.max(0, Math.min(100, rSquared * 100));
    
    // Determine direction based on slope
    const avgPrice = meanY;
    const slopeThreshold = avgPrice * 0.001; // 0.1% of average price
    
    if (slope > slopeThreshold) {
      return { direction: 'BULLISH', strength };
    } else if (slope < -slopeThreshold) {
      return { direction: 'BEARISH', strength };
    } else {
      return { direction: 'NEUTRAL', strength };
    }
  }

  private calculateTrendStrength(closes: number[]): number {
    const trend = this.calculateTrend(closes);
    return trend.strength;
  }

  private analyzeVolume(volumes: number[]): { status: 'HIGH' | 'MODERATE' | 'LOW'; average: number; current: number } {
    if (volumes.length === 0) {
      return { status: 'LOW', average: 0, current: 0 };
    }

    const average = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const current = volumes[volumes.length - 1];
    
    let status: 'HIGH' | 'MODERATE' | 'LOW';
    
    if (current > average * 1.5) {
      status = 'HIGH';
    } else if (current > average * 0.8) {
      status = 'MODERATE';
    } else {
      status = 'LOW';
    }
    
    return { status, average, current };
  }

  private findSupportResistance(highs: number[], lows: number[], closes: number[]): {
    level: 'STRONG' | 'MODERATE' | 'WEAK';
    support: number;
    resistance: number;
  } {
    if (highs.length < 10) {
      return { level: 'WEAK', support: 0, resistance: 0 };
    }

    // Find recent highs and lows
    const recentPeriod = Math.min(20, highs.length);
    const recentHighs = highs.slice(-recentPeriod);
    const recentLows = lows.slice(-recentPeriod);
    const recentCloses = closes.slice(-recentPeriod);
    
    // Calculate potential support and resistance levels
    const maxHigh = Math.max(...recentHighs);
    const minLow = Math.min(...recentLows);
    const currentPrice = recentCloses[recentCloses.length - 1];
    
    // Simple support/resistance calculation
    const resistance = maxHigh;
    const support = minLow;
    
    // Determine strength based on how many times price has tested these levels
    const resistanceTests = recentHighs.filter(h => Math.abs(h - resistance) / resistance < 0.001).length;
    const supportTests = recentLows.filter(l => Math.abs(l - support) / support < 0.001).length;
    
    const totalTests = resistanceTests + supportTests;
    
    let level: 'STRONG' | 'MODERATE' | 'WEAK';
    if (totalTests >= 3) {
      level = 'STRONG';
    } else if (totalTests >= 2) {
      level = 'MODERATE';
    } else {
      level = 'WEAK';
    }
    
    return { level, support, resistance };
  }

  private calculateBollingerBands(closes: number[], period: number = 20, stdDev: number = 2): {
    upper: number;
    middle: number;
    lower: number;
    position: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
  } {
    if (closes.length < period) {
      const current = closes[closes.length - 1] || 0;
      return {
        upper: current,
        middle: current,
        lower: current,
        position: 'NEUTRAL'
      };
    }

    const sma = this.simpleMovingAverage(closes, period);
    const middle = sma[sma.length - 1];
    
    // Calculate standard deviation
    const recentCloses = closes.slice(-period);
    const variance = recentCloses.reduce((sum, close) => sum + Math.pow(close - middle, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    const upper = middle + (stdDev * standardDeviation);
    const lower = middle - (stdDev * standardDeviation);
    const current = closes[closes.length - 1];
    
    let position: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
    
    if (current >= upper) {
      position = 'OVERBOUGHT';
    } else if (current <= lower) {
      position = 'OVERSOLD';
    } else {
      position = 'NEUTRAL';
    }
    
    return { upper, middle, lower, position };
  }

  private calculateStochastic(highs: number[], lows: number[], closes: number[], period: number = 14): {
    k: number;
    d: number;
    signal: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
  } {
    if (closes.length < period) {
      return { k: 50, d: 50, signal: 'NEUTRAL' };
    }

    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const currentClose = closes[closes.length - 1];
    
    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);
    
    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    
    // Calculate %D (3-period SMA of %K) - simplified to just %K for now
    const d = k;
    
    let signal: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
    
    if (k >= 80) {
      signal = 'OVERBOUGHT';
    } else if (k <= 20) {
      signal = 'OVERSOLD';
    } else {
      signal = 'NEUTRAL';
    }
    
    return { k, d, signal };
  }

  private calculateEMA(closes: number[]): {
    short: number;
    long: number;
    signal: 'ABOVE' | 'BELOW' | 'CROSSING';
  } {
    const ema12 = this.exponentialMovingAverage(closes, 12);
    const ema26 = this.exponentialMovingAverage(closes, 26);
    
    if (ema12.length === 0 || ema26.length === 0) {
      const current = closes[closes.length - 1] || 0;
      return { short: current, long: current, signal: 'CROSSING' };
    }
    
    const short = ema12[ema12.length - 1];
    const long = ema26[ema26.length - 1];
    
    let signal: 'ABOVE' | 'BELOW' | 'CROSSING';
    
    if (short > long) {
      signal = 'ABOVE';
    } else if (short < long) {
      signal = 'BELOW';
    } else {
      signal = 'CROSSING';
    }
    
    return { short, long, signal };
  }

  private simpleMovingAverage(data: number[], period: number): number[] {
    const result: number[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    
    return result;
  }

  private exponentialMovingAverage(data: number[], period: number): number[] {
    if (data.length === 0) return [];
    
    const result: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with simple moving average for first value
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(ema);
    
    // Calculate EMA for remaining values
    for (let i = period; i < data.length; i++) {
      ema = (data[i] * multiplier) + (ema * (1 - multiplier));
      result.push(ema);
    }
    
    return result;
  }

  // Utility method for confluence analysis
  public calculateConfluenceScore(indicators: TechnicalIndicators): number {
    let score = 0;
    let maxScore = 0;

    // RSI Score (20 points)
    maxScore += 20;
    if (indicators.rsi > 30 && indicators.rsi < 70) {
      score += 20; // Neutral RSI is good
    } else if (indicators.rsi <= 30 || indicators.rsi >= 70) {
      score += 10; // Extreme RSI can signal reversal
    }

    // MACD Score (25 points)
    maxScore += 25;
    if (indicators.macd === 'BULLISH' || indicators.macd === 'BEARISH') {
      score += 25;
    }

    // Volume Score (15 points)
    maxScore += 15;
    if (indicators.volume.status === 'HIGH') {
      score += 15;
    } else if (indicators.volume.status === 'MODERATE') {
      score += 10;
    }

    // Support/Resistance Score (20 points)
    maxScore += 20;
    if (indicators.supportResistance.level === 'STRONG') {
      score += 20;
    } else if (indicators.supportResistance.level === 'MODERATE') {
      score += 10;
    }

    // Trend Strength Score (20 points)
    maxScore += 20;
    if (indicators.strength >= 80) {
      score += 20;
    } else if (indicators.strength >= 60) {
      score += 15;
    } else if (indicators.strength >= 40) {
      score += 10;
    }

    return Math.round((score / maxScore) * 100);
  }
}

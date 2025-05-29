import { 
  trades, 
  marketData, 
  botSettings, 
  signals, 
  users,
  licenses,
  gainPayments,
  type Trade, 
  type InsertTrade,
  type MarketData,
  type InsertMarketData,
  type BotSettings,
  type InsertBotSettings,
  type Signal,
  type InsertSignal,
  type User,
  type InsertUser,
  type License,
  type InsertLicense,
  type GainPayment,
  type InsertGainPayment
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // License methods
  createLicense(license: InsertLicense): Promise<License>;
  getUserLicense(userId: number): Promise<License | undefined>;
  updateLicense(id: number, updates: Partial<License>): Promise<License | undefined>;

  // Gain Payment methods
  createGainPayment(payment: InsertGainPayment): Promise<GainPayment>;
  getUserGainPayments(userId: number): Promise<GainPayment[]>;
  updateGainPayment(id: number, updates: Partial<GainPayment>): Promise<GainPayment | undefined>;
  getPendingGainPayments(): Promise<GainPayment[]>;

  // Trade methods
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTrade(id: number, updates: Partial<Trade>): Promise<Trade | undefined>;
  getActiveTrades(userId: number): Promise<Trade[]>;
  getTradeHistory(userId: number, limit?: number): Promise<Trade[]>;
  getTrade(id: number): Promise<Trade | undefined>;

  // Market data methods
  addMarketData(data: InsertMarketData): Promise<MarketData>;
  getLatestMarketData(pair: string): Promise<MarketData | undefined>;
  getMarketDataHistory(pair: string, limit?: number): Promise<MarketData[]>;

  // Bot settings methods
  getBotSettings(userId: number): Promise<BotSettings | undefined>;
  updateBotSettings(userId: number, settings: Partial<BotSettings>): Promise<BotSettings>;

  // Signal methods
  createSignal(signal: InsertSignal): Promise<Signal>;
  getLatestSignals(pair: string, limit?: number): Promise<Signal[]>;

  // Performance methods
  getDailyPnL(userId: number, date: Date): Promise<number>;
  getWinRate(userId: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private licenses: Map<number, License>;
  private gainPayments: Map<number, GainPayment>;
  private trades: Map<number, Trade>;
  private marketData: Map<number, MarketData>;
  private botSettings: Map<number, BotSettings>;
  private signals: Map<number, Signal>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.licenses = new Map();
    this.gainPayments = new Map();
    this.trades = new Map();
    this.marketData = new Map();
    this.botSettings = new Map();
    this.signals = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      licenseType: insertUser.licenseType || null,
      licenseStatus: "inactive",
      licenseExpiresAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    
    // Create default bot settings for new user
    const defaultSettings: BotSettings = {
      id: this.currentId++,
      userId: id,
      isActive: false,
      initialAmount: "20.00",
      primaryTimeframe: 60,
      secondaryTimeframe: 10,
      multiplier: 10,
      maxDailyLoss: "500.00",
      riskManagement: true,
    };
    this.botSettings.set(id, defaultSettings);
    
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { 
      ...user, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createLicense(insertLicense: InsertLicense): Promise<License> {
    const id = this.currentId++;
    const license: License = {
      ...insertLicense,
      id,
      currency: insertLicense.currency || "BRL",
      paymentMethod: insertLicense.paymentMethod || null,
      stripePaymentIntentId: insertLicense.stripePaymentIntentId || null,
      stripeSubscriptionId: insertLicense.stripeSubscriptionId || null,
      activatedAt: insertLicense.activatedAt || null,
      expiresAt: insertLicense.expiresAt || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.licenses.set(id, license);
    return license;
  }

  async getUserLicense(userId: number): Promise<License | undefined> {
    return Array.from(this.licenses.values()).find(license => 
      license.userId === userId && license.status === 'active'
    );
  }

  async updateLicense(id: number, updates: Partial<License>): Promise<License | undefined> {
    const license = this.licenses.get(id);
    if (!license) return undefined;

    const updatedLicense = { 
      ...license, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.licenses.set(id, updatedLicense);
    return updatedLicense;
  }

  async createGainPayment(insertGainPayment: InsertGainPayment): Promise<GainPayment> {
    const id = this.currentId++;
    const gainPayment: GainPayment = {
      ...insertGainPayment,
      id,
      feePercentage: insertGainPayment.feePercentage || "0.5",
      paymentStatus: insertGainPayment.paymentStatus || "pending",
      pixTransactionId: insertGainPayment.pixTransactionId || null,
      processedAt: insertGainPayment.processedAt || null,
      createdAt: new Date()
    };
    this.gainPayments.set(id, gainPayment);
    return gainPayment;
  }

  async getUserGainPayments(userId: number): Promise<GainPayment[]> {
    return Array.from(this.gainPayments.values()).filter(payment => 
      payment.userId === userId
    );
  }

  async updateGainPayment(id: number, updates: Partial<GainPayment>): Promise<GainPayment | undefined> {
    const payment = this.gainPayments.get(id);
    if (!payment) return undefined;

    const updatedPayment = { ...payment, ...updates };
    this.gainPayments.set(id, updatedPayment);
    return updatedPayment;
  }

  async getPendingGainPayments(): Promise<GainPayment[]> {
    return Array.from(this.gainPayments.values()).filter(payment => 
      payment.paymentStatus === "pending"
    );
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = this.currentId++;
    const trade: Trade = {
      ...insertTrade,
      id,
      isActive: insertTrade.isActive ?? true,
      entryPrice: insertTrade.entryPrice ?? null,
      exitPrice: insertTrade.exitPrice ?? null,
      result: insertTrade.result ?? null,
      payout: insertTrade.payout ?? null,
      parentTradeId: insertTrade.parentTradeId ?? null,
      isMartingale: insertTrade.isMartingale ?? false,
      entryTime: new Date(),
      exitTime: null,
    };
    this.trades.set(id, trade);
    return trade;
  }

  async updateTrade(id: number, updates: Partial<Trade>): Promise<Trade | undefined> {
    const trade = this.trades.get(id);
    if (!trade) return undefined;

    const updatedTrade = { ...trade, ...updates };
    this.trades.set(id, updatedTrade);
    return updatedTrade;
  }

  async getActiveTrades(userId: number): Promise<Trade[]> {
    return Array.from(this.trades.values()).filter(
      trade => trade.userId === userId && trade.isActive
    );
  }

  async getTradeHistory(userId: number, limit = 50): Promise<Trade[]> {
    return Array.from(this.trades.values())
      .filter(trade => trade.userId === userId)
      .sort((a, b) => {
        const dateA = a.entryTime ? new Date(a.entryTime).getTime() : 0;
        const dateB = b.entryTime ? new Date(b.entryTime).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  }

  async getTrade(id: number): Promise<Trade | undefined> {
    return this.trades.get(id);
  }

  async addMarketData(data: InsertMarketData): Promise<MarketData> {
    const id = this.currentId++;
    const marketDataEntry: MarketData = {
      ...data,
      id,
      timestamp: new Date(),
    };
    this.marketData.set(id, marketDataEntry);
    return marketDataEntry;
  }

  async getLatestMarketData(pair: string): Promise<MarketData | undefined> {
    const pairData = Array.from(this.marketData.values())
      .filter(data => data.pair === pair)
      .sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
      });
    
    return pairData[0];
  }

  async getMarketDataHistory(pair: string, limit = 100): Promise<MarketData[]> {
    return Array.from(this.marketData.values())
      .filter(data => data.pair === pair)
      .sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  }

  async getBotSettings(userId: number): Promise<BotSettings | undefined> {
    return this.botSettings.get(userId);
  }

  async updateBotSettings(userId: number, settings: Partial<BotSettings>): Promise<BotSettings> {
    const existing = this.botSettings.get(userId);
    const updated: BotSettings = {
      id: existing?.id || this.currentId++,
      userId,
      isActive: false,
      initialAmount: "20.00",
      primaryTimeframe: 60,
      secondaryTimeframe: 10,
      multiplier: 10,
      maxDailyLoss: "500.00",
      riskManagement: true,
      ...existing,
      ...settings,
    };
    this.botSettings.set(userId, updated);
    return updated;
  }

  async createSignal(signal: InsertSignal): Promise<Signal> {
    const id = this.currentId++;
    const signalEntry: Signal = {
      ...signal,
      id,
      timestamp: new Date(),
    };
    this.signals.set(id, signalEntry);
    return signalEntry;
  }

  async getLatestSignals(pair: string, limit = 10): Promise<Signal[]> {
    return Array.from(this.signals.values())
      .filter(signal => signal.pair === pair)
      .sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  }

  async getDailyPnL(userId: number, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dayTrades = Array.from(this.trades.values()).filter(trade => {
      const tradeDate = trade.entryTime ? new Date(trade.entryTime) : null;
      return trade.userId === userId && 
             tradeDate && 
             tradeDate >= startOfDay && 
             tradeDate <= endOfDay &&
             trade.result !== null;
    });

    return dayTrades.reduce((total, trade) => {
      if (trade.result === 'WIN') {
        return total + parseFloat(trade.payout || "0");
      } else if (trade.result === 'LOSS') {
        return total - parseFloat(trade.entryAmount);
      }
      return total;
    }, 0);
  }

  async getWinRate(userId: number): Promise<number> {
    const completedTrades = Array.from(this.trades.values()).filter(
      trade => trade.userId === userId && trade.result !== null
    );

    if (completedTrades.length === 0) return 0;

    const wins = completedTrades.filter(trade => trade.result === 'WIN').length;
    return (wins / completedTrades.length) * 100;
  }
}

export const storage = new MemStorage();

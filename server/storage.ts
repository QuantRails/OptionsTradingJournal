import {
  trades,
  premarketAnalysis,
  tradeAnalysis,
  playbookStrategies,
  intradayNotes,
  settings,
  users,
  type Trade,
  type InsertTrade,
  type PremarketAnalysis,
  type InsertPremarketAnalysis,
  type TradeAnalysis,
  type InsertTradeAnalysis,
  type PlaybookStrategy,
  type InsertPlaybookStrategy,
  type IntradayNote,
  type InsertIntradayNote,
  type Settings,
  type InsertSettings,
  type User,
  type UpsertUser,
} from "@shared/schema";

export interface IStorage {
  // User operations (required for authentication)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Trades
  getTrades(): Promise<Trade[]>;
  getTrade(id: number): Promise<Trade | undefined>;
  getTradesByDate(date: Date): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTrade(id: number, trade: Partial<InsertTrade>): Promise<Trade | undefined>;
  deleteTrade(id: number): Promise<boolean>;
  
  // Premarket Analysis
  getPremarketAnalysis(): Promise<PremarketAnalysis[]>;
  getPremarketAnalysisByDate(date: Date): Promise<PremarketAnalysis | undefined>;
  createPremarketAnalysis(analysis: InsertPremarketAnalysis): Promise<PremarketAnalysis>;
  updatePremarketAnalysis(id: number, analysis: Partial<InsertPremarketAnalysis>): Promise<PremarketAnalysis | undefined>;
  
  // Trade Analysis
  getTradeAnalyses(): Promise<TradeAnalysis[]>;
  getTradeAnalysis(tradeId: number): Promise<TradeAnalysis | undefined>;
  createTradeAnalysis(analysis: InsertTradeAnalysis): Promise<TradeAnalysis>;
  updateTradeAnalysis(id: number, analysis: Partial<InsertTradeAnalysis>): Promise<TradeAnalysis | undefined>;
  
  // Playbook Strategies
  getPlaybookStrategies(): Promise<PlaybookStrategy[]>;
  createPlaybookStrategy(strategy: InsertPlaybookStrategy): Promise<PlaybookStrategy>;
  updatePlaybookStrategy(id: number, strategy: Partial<InsertPlaybookStrategy>): Promise<PlaybookStrategy | undefined>;
  deletePlaybookStrategy(id: number): Promise<boolean>;
  
  // Intraday Notes
  getIntradayNotes(): Promise<IntradayNote[]>;
  getIntradayNotesByDate(date: Date): Promise<IntradayNote[]>;
  createIntradayNote(note: InsertIntradayNote): Promise<IntradayNote>;
  updateIntradayNote(id: number, note: Partial<InsertIntradayNote>): Promise<IntradayNote | undefined>;
  deleteIntradayNote(id: number): Promise<boolean>;
  
  // Clear all data
  clearAllData(): Promise<boolean>;
  
  // Settings
  getSetting(key: string): Promise<Settings | undefined>;
  setSetting(key: string, value: string): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private trades: Map<number, Trade>;
  private premarketAnalyses: Map<number, PremarketAnalysis>;
  private tradeAnalyses: Map<number, TradeAnalysis>;
  private playbookStrategies: Map<number, PlaybookStrategy>;
  private intradayNotes: Map<number, IntradayNote>;
  private settings: Map<string, Settings>;
  private users: Map<string, User>;
  private currentTradeId: number;
  private currentPremarketId: number;
  private currentAnalysisId: number;
  private currentStrategyId: number;
  private currentNoteId: number;
  private currentSettingId: number;

  constructor() {
    this.trades = new Map();
    this.premarketAnalyses = new Map();
    this.tradeAnalyses = new Map();
    this.playbookStrategies = new Map();
    this.intradayNotes = new Map();
    this.settings = new Map();
    this.users = new Map();
    this.currentTradeId = 1;
    this.currentPremarketId = 1;
    this.currentAnalysisId = 1;
    this.currentStrategyId = 1;
    this.currentNoteId = 1;
    this.currentSettingId = 1;
    
    this.initializeDefaultStrategies();
    this.initializeDefaultSettings();
    this.initializeSampleTrades();
  }

  private initializeDefaultStrategies() {
    const defaultStrategies = [
      { name: "No Strategy", description: "No strategy assigned - needs categorization", isDefault: true },
      { name: "Pullback long off VWAP", description: "Long calls when price pulls back to VWAP with volume confirmation", isDefault: true },
      { name: "Short off Call Resistance", description: "Short puts when price rejects at call resistance level", isDefault: true },
      { name: "Long off Resistance", description: "Long calls when price breaks above resistance with volume", isDefault: true },
      { name: "Long off Put Support", description: "Long calls when price bounces off put support with volume", isDefault: true },
      { name: "Short off Put Support", description: "Short puts when price breaks below put support level", isDefault: true },
    ];

    defaultStrategies.forEach(strategy => {
      const id = this.currentStrategyId++;
      const fullStrategy: PlaybookStrategy = {
        id,
        ...strategy,
        createdAt: new Date(),
      };
      this.playbookStrategies.set(id, fullStrategy);
    });
  }

  private initializeDefaultSettings() {
    const accountBalanceSetting: Settings = {
      id: this.currentSettingId++,
      key: "account_balance",
      value: "25000",
      updatedAt: new Date(),
    };
    this.settings.set("account_balance", accountBalanceSetting);
  }

  private initializeSampleTrades() {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(today.getTime() - 48 * 60 * 60 * 1000);

    // Create sample trades directly with proper types
    const trade1: Trade = {
      id: this.currentTradeId++,
      ticker: "SPY",
      type: "calls",
      quantity: 5,
      entryPrice: 2.50,
      exitPrice: 3.75,
      entryTime: new Date(`${today.toDateString()} 09:35:00`),
      exitTime: new Date(`${today.toDateString()} 10:15:00`),
      strikePrice: 580,
      expirationDate: new Date("2024-12-20"),
      pnl: 625,
      entryReason: "Bullish breakout above resistance",
      exitReason: "Target reached at 50% gain",
      playbookId: 5, // Short off Put Support strategy
      timeClassification: null,
      tradeDate: today,
      createdAt: new Date(),
    };

    const trade2: Trade = {
      id: this.currentTradeId++,
      ticker: "AAPL",
      type: "puts",
      quantity: 3,
      entryPrice: 1.80,
      exitPrice: 1.25,
      entryTime: new Date(`${yesterday.toDateString()} 14:20:00`),
      exitTime: new Date(`${yesterday.toDateString()} 15:45:00`),
      strikePrice: 190,
      expirationDate: new Date("2024-12-22"),
      pnl: -165,
      entryReason: "Bearish divergence on RSI",
      exitReason: "Stop loss hit",
      playbookId: 5, // Short off Put Support strategy
      timeClassification: null,
      tradeDate: yesterday,
      createdAt: new Date(),
    };

    const trade3: Trade = {
      id: this.currentTradeId++,
      ticker: "QQQ",
      type: "calls",
      quantity: 10,
      entryPrice: 1.95,
      exitPrice: 2.80,
      entryTime: new Date(`${twoDaysAgo.toDateString()} 10:05:00`),
      exitTime: new Date(`${twoDaysAgo.toDateString()} 11:30:00`),
      strikePrice: 520,
      expirationDate: new Date("2024-12-18"),
      pnl: 850,
      entryReason: "Bounce off VWAP support",
      exitReason: "Profit target achieved",
      playbookId: 5, // Short off Put Support strategy
      timeClassification: null,
      tradeDate: twoDaysAgo,
      createdAt: new Date(),
    };

    this.trades.set(trade1.id, trade1);
    this.trades.set(trade2.id, trade2);
    this.trades.set(trade3.id, trade3);

    // Create sample intraday notes with proper schema structure
    const note1: IntradayNote = {
      id: this.currentNoteId++,
      date: today,
      time: new Date(`${today.toDateString()} 09:30:00`),
      note: "Market opened with strong bullish momentum. SPY gapping up on good volume.",
      createdAt: new Date(),
    };

    const note2: IntradayNote = {
      id: this.currentNoteId++,
      date: yesterday,
      time: new Date(`${yesterday.toDateString()} 14:15:00`),
      note: "Choppy session with mixed signals. Stayed smaller size due to uncertainty.",
      createdAt: new Date(),
    };

    this.intradayNotes.set(note1.id, note1);
    this.intradayNotes.set(note2.id, note2);

    // Create sample trade analyses
    const analysis1: TradeAnalysis = {
      id: this.currentAnalysisId++,
      tradeId: trade1.id,
      whatWentWell: "Perfect entry timing on the breakout. Good risk management with position sizing.",
      whatToImprove: "Could have held longer for bigger gains. Exit was a bit early.",
      nextTime: "Will use trailing stops to capture more upside while protecting profits.",
      screenshotUrl: null,
      createdAt: new Date(),
    };

    const analysis2: TradeAnalysis = {
      id: this.currentAnalysisId++,
      tradeId: trade2.id,
      whatWentWell: "Recognized the bearish setup correctly. Entry was well-timed.",
      whatToImprove: "Stop loss was too tight for the volatility. Should have given more room.",
      nextTime: "Will use ATR-based stops for better volatility adjustment.",
      screenshotUrl: null,
      createdAt: new Date(),
    };

    this.tradeAnalyses.set(analysis1.id, analysis1);
    this.tradeAnalyses.set(analysis2.id, analysis2);
  }

  // User operations (required for authentication)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    
    if (existingUser) {
      // Update existing user
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        updatedAt: new Date(),
      };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    } else {
      // Create new user
      const newUser: User = {
        id: userData.id,
        email: userData.email ?? null,
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        profileImageUrl: userData.profileImageUrl ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(userData.id, newUser);
      return newUser;
    }
  }

  // Trades
  async getTrades(): Promise<Trade[]> {
    return Array.from(this.trades.values()).sort((a, b) => b.id - a.id);
  }

  async getTrade(id: number): Promise<Trade | undefined> {
    return this.trades.get(id);
  }

  async getTradesByDate(date: Date): Promise<Trade[]> {
    // Normalize both dates to CST timezone for comparison
    const targetDate = new Date(date);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();
    
    return Array.from(this.trades.values()).filter(trade => {
      const tradeDate = new Date(trade.tradeDate);
      return tradeDate.getFullYear() === year && 
             tradeDate.getMonth() === month && 
             tradeDate.getDate() === day;
    });
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = this.currentTradeId++;
    
    // Calculate P&L if both entry and exit prices are provided
    let calculatedPnL = insertTrade.pnl ?? null;
    if (insertTrade.exitPrice && insertTrade.entryPrice) {
      const priceDiff = insertTrade.exitPrice - insertTrade.entryPrice;
      calculatedPnL = priceDiff * insertTrade.quantity * 100; // Options are in contracts of 100
    }
    
    // Classify time of day based on entry time
    let timeClassification = insertTrade.timeClassification ?? null;
    if (insertTrade.entryTime) {
      const hour = new Date(insertTrade.entryTime).getHours();
      if (hour >= 9 && hour < 10) {
        timeClassification = "Open";
      } else if (hour >= 10 && hour < 11) {
        timeClassification = "Morning";
      } else if (hour >= 11 && hour < 14) {
        timeClassification = "Midday";
      } else if (hour >= 14 && hour < 16) {
        timeClassification = "Close";
      } else {
        timeClassification = "Other";
      }
    }
    
    const trade: Trade = {
      id,
      ...insertTrade,
      exitPrice: insertTrade.exitPrice ?? null,
      exitTime: insertTrade.exitTime ?? null,
      pnl: calculatedPnL,
      entryReason: insertTrade.entryReason ?? null,
      exitReason: insertTrade.exitReason ?? null,
      playbookId: insertTrade.playbookId ?? null,
      timeClassification,
      createdAt: new Date(),
    };
    this.trades.set(id, trade);
    return trade;
  }

  async updateTrade(id: number, updateData: Partial<InsertTrade>): Promise<Trade | undefined> {
    const existingTrade = this.trades.get(id);
    if (!existingTrade) return undefined;
    
    const mergedTrade = { ...existingTrade, ...updateData };
    
    // Recalculate P&L if entry or exit price changed
    let calculatedPnL = mergedTrade.pnl;
    if (mergedTrade.exitPrice && mergedTrade.entryPrice) {
      const priceDiff = mergedTrade.exitPrice - mergedTrade.entryPrice;
      calculatedPnL = priceDiff * mergedTrade.quantity * 100; // Options are in contracts of 100
    }
    
    // Update time classification if entry time changed
    let timeClassification = mergedTrade.timeClassification;
    if (updateData.entryTime || (!existingTrade.timeClassification && mergedTrade.entryTime)) {
      const hour = new Date(mergedTrade.entryTime).getHours();
      if (hour >= 9 && hour < 10) {
        timeClassification = "Open";
      } else if (hour >= 10 && hour < 11) {
        timeClassification = "Morning";
      } else if (hour >= 11 && hour < 14) {
        timeClassification = "Midday";
      } else if (hour >= 14 && hour < 16) {
        timeClassification = "Close";
      } else {
        timeClassification = "Other";
      }
    }
    
    const updatedTrade: Trade = { 
      ...mergedTrade, 
      pnl: calculatedPnL,
      timeClassification 
    };
    this.trades.set(id, updatedTrade);
    return updatedTrade;
  }

  async deleteTrade(id: number): Promise<boolean> {
    return this.trades.delete(id);
  }

  // Premarket Analysis
  async getPremarketAnalysis(): Promise<PremarketAnalysis[]> {
    return Array.from(this.premarketAnalyses.values()).sort((a, b) => b.id - a.id);
  }

  async getPremarketAnalysisByDate(date: Date): Promise<PremarketAnalysis | undefined> {
    const dateStr = date.toDateString();
    return Array.from(this.premarketAnalyses.values()).find(analysis =>
      analysis.date.toDateString() === dateStr
    );
  }

  async createPremarketAnalysis(insertAnalysis: InsertPremarketAnalysis): Promise<PremarketAnalysis> {
    const id = this.currentPremarketId++;
    const analysis: PremarketAnalysis = {
      id,
      date: insertAnalysis.date,
      bias: insertAnalysis.bias ?? null,
      climateNotes: insertAnalysis.climateNotes ?? null,
      hasEconomicEvents: insertAnalysis.hasEconomicEvents ?? null,
      economicEvents: insertAnalysis.economicEvents ?? null,
      economicImpact: insertAnalysis.economicImpact ?? null,
      vixValue: insertAnalysis.vixValue ?? null,
      expectedVolatility: insertAnalysis.expectedVolatility ?? null,
      gammaEnvironment: insertAnalysis.gammaEnvironment ?? null,
      esFuturesLevel: insertAnalysis.esFuturesLevel ?? null,
      esFuturesLevelType: insertAnalysis.esFuturesLevelType ?? null,
      esVolumeAnalysis: insertAnalysis.esVolumeAnalysis ?? null,
      nqFuturesLevel: insertAnalysis.nqFuturesLevel ?? null,
      nqFuturesLevelType: insertAnalysis.nqFuturesLevelType ?? null,
      nqVolumeAnalysis: insertAnalysis.nqVolumeAnalysis ?? null,
      rtyFuturesLevel: insertAnalysis.rtyFuturesLevel ?? null,
      rtyFuturesLevelType: insertAnalysis.rtyFuturesLevelType ?? null,
      rtyVolumeAnalysis: insertAnalysis.rtyVolumeAnalysis ?? null,
      callResistance: insertAnalysis.callResistance ?? null,
      putSupport: insertAnalysis.putSupport ?? null,
      hvlLevel: insertAnalysis.hvlLevel ?? null,
      vaultLevel: insertAnalysis.vaultLevel ?? null,
      vwapLevel: insertAnalysis.vwapLevel ?? null,
      keyLevels: insertAnalysis.keyLevels ?? null,
      spyAnalysis: insertAnalysis.spyAnalysis ?? null,
      spyCriticalLevel: insertAnalysis.spyCriticalLevel ?? null,
      spyCriticalLevelType: insertAnalysis.spyCriticalLevelType ?? null,
      spyDirection: insertAnalysis.spyDirection ?? null,
      dpofTrend: insertAnalysis.dpofTrend ?? null,
      dpofVolumeDivergence: insertAnalysis.dpofVolumeDivergence ?? null,
      dpofCenterline: insertAnalysis.dpofCenterline ?? null,
      dpofExpansionDivergence: insertAnalysis.dpofExpansionDivergence ?? null,
      dpofAbsorption: insertAnalysis.dpofAbsorption ?? null,
      volumeGapExists: insertAnalysis.volumeGapExists ?? null,
      volumeGapRR: insertAnalysis.volumeGapRR ?? null,
      deltaExposureAnalyzed: insertAnalysis.deltaExposureAnalyzed ?? null,
      squeezeMomoDirection: insertAnalysis.squeezeMomoDirection ?? null,
      isInSqueeze: insertAnalysis.isInSqueeze ?? null,
      bondCorrelation: insertAnalysis.bondCorrelation ?? null,
      tradeIdea1: insertAnalysis.tradeIdea1 ?? null,
      tradeIdea2: insertAnalysis.tradeIdea2 ?? null,
      tradeIdea3: insertAnalysis.tradeIdea3 ?? null,
      createdAt: new Date(),
    };
    this.premarketAnalyses.set(id, analysis);
    return analysis;
  }

  async updatePremarketAnalysis(id: number, updateData: Partial<InsertPremarketAnalysis>): Promise<PremarketAnalysis | undefined> {
    const existing = this.premarketAnalyses.get(id);
    if (!existing) return undefined;

    const processedUpdateData = { ...updateData };
    if (processedUpdateData.date && typeof processedUpdateData.date === 'string') {
      processedUpdateData.date = new Date(processedUpdateData.date);
    }

    const updated: PremarketAnalysis = { ...existing, ...processedUpdateData };
    this.premarketAnalyses.set(id, updated);
    return updated;
  }

  // Trade Analysis
  async getTradeAnalyses(): Promise<TradeAnalysis[]> {
    return Array.from(this.tradeAnalyses.values()).sort((a, b) => b.id - a.id);
  }

  async getTradeAnalysis(tradeId: number): Promise<TradeAnalysis | undefined> {
    return Array.from(this.tradeAnalyses.values()).find(analysis => analysis.tradeId === tradeId);
  }

  async createTradeAnalysis(insertAnalysis: InsertTradeAnalysis): Promise<TradeAnalysis> {
    const id = this.currentAnalysisId++;
    const analysis: TradeAnalysis = {
      id,
      tradeId: insertAnalysis.tradeId,
      screenshotUrl: insertAnalysis.screenshotUrl ?? null,
      whatWentWell: insertAnalysis.whatWentWell ?? null,
      whatToImprove: insertAnalysis.whatToImprove ?? null,
      nextTime: insertAnalysis.nextTime ?? null,
      createdAt: new Date(),
    };
    this.tradeAnalyses.set(id, analysis);
    return analysis;
  }

  async updateTradeAnalysis(id: number, updateData: Partial<InsertTradeAnalysis>): Promise<TradeAnalysis | undefined> {
    const existing = this.tradeAnalyses.get(id);
    if (!existing) return undefined;
    
    const updated: TradeAnalysis = { ...existing, ...updateData };
    this.tradeAnalyses.set(id, updated);
    return updated;
  }

  // Playbook Strategies
  async getPlaybookStrategies(): Promise<PlaybookStrategy[]> {
    return Array.from(this.playbookStrategies.values()).sort((a, b) => b.id - a.id);
  }

  async createPlaybookStrategy(insertStrategy: InsertPlaybookStrategy): Promise<PlaybookStrategy> {
    const id = this.currentStrategyId++;
    const strategy: PlaybookStrategy = {
      id,
      name: insertStrategy.name,
      description: insertStrategy.description ?? null,
      isDefault: insertStrategy.isDefault ?? null,
      createdAt: new Date(),
    };
    this.playbookStrategies.set(id, strategy);
    return strategy;
  }

  async updatePlaybookStrategy(id: number, updateData: Partial<InsertPlaybookStrategy>): Promise<PlaybookStrategy | undefined> {
    const existing = this.playbookStrategies.get(id);
    if (!existing) return undefined;
    
    const updated: PlaybookStrategy = { ...existing, ...updateData };
    this.playbookStrategies.set(id, updated);
    return updated;
  }

  async deletePlaybookStrategy(id: number): Promise<boolean> {
    return this.playbookStrategies.delete(id);
  }

  // Intraday Notes
  async getIntradayNotes(): Promise<IntradayNote[]> {
    return Array.from(this.intradayNotes.values()).sort((a, b) => b.id - a.id);
  }

  async getIntradayNotesByDate(date: Date): Promise<IntradayNote[]> {
    const dateStr = date.toDateString();
    return Array.from(this.intradayNotes.values()).filter(note =>
      note.date.toDateString() === dateStr
    );
  }

  async createIntradayNote(insertNote: InsertIntradayNote): Promise<IntradayNote> {
    const id = this.currentNoteId++;
    const note: IntradayNote = {
      id,
      ...insertNote,
      createdAt: new Date(),
    };
    this.intradayNotes.set(id, note);
    return note;
  }

  async updateIntradayNote(id: number, updateData: Partial<InsertIntradayNote>): Promise<IntradayNote | undefined> {
    const existing = this.intradayNotes.get(id);
    if (!existing) return undefined;
    
    const updated: IntradayNote = { ...existing, ...updateData };
    this.intradayNotes.set(id, updated);
    return updated;
  }

  async deleteIntradayNote(id: number): Promise<boolean> {
    return this.intradayNotes.delete(id);
  }

  // Settings
  async getSetting(key: string): Promise<Settings | undefined> {
    return this.settings.get(key);
  }

  async setSetting(key: string, value: string): Promise<Settings> {
    const existing = this.settings.get(key);
    if (existing) {
      const updated: Settings = {
        ...existing,
        value,
      };
      this.settings.set(key, updated);
      return updated;
    } else {
      const newSetting: Settings = {
        id: this.currentSettingId++,
        key,
        value,
        updatedAt: new Date(),
      };
      this.settings.set(key, newSetting);
      return newSetting;
    }
  }

  // Clear all data
  async clearAllData(): Promise<boolean> {
    this.trades.clear();
    this.premarketAnalyses.clear();
    this.tradeAnalyses.clear();
    this.intradayNotes.clear();
    
    // Reset IDs but keep strategies and settings
    this.currentTradeId = 1;
    this.currentPremarketId = 1;
    this.currentAnalysisId = 1;
    this.currentNoteId = 1;
    
    return true;
  }
}

export const storage = new MemStorage();
import { 
  trades, 
  premarketAnalysis, 
  tradeAnalysis, 
  playbookStrategies,
  intradayNotes,
  settings,
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
  type InsertSettings
} from "@shared/schema";

export interface IStorage {
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
    this.currentTradeId = 1;
    this.currentPremarketId = 1;
    this.currentAnalysisId = 1;
    this.currentStrategyId = 1;
    this.currentNoteId = 1;
    this.currentSettingId = 1;
    
    this.initializeDefaultStrategies();
    this.initializeDefaultSettings();
  }

  private initializeDefaultStrategies() {
    const defaultStrategies = [
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

  // Removed sample data - application starts clean
    // Sample trades for the last 7 days
    const today = new Date();
    const sampleTrades = [
      {
        id: this.currentTradeId++,
        ticker: "SPY",
        type: "calls",
        quantity: 5,
        entryPrice: 2.15,
        exitPrice: 3.40,
        entryTime: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000 + 45 * 60 * 1000),
        exitTime: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000 + 30 * 60 * 1000),
        tradeDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        pnl: 625,
        entryReason: "VWAP bounce with volume confirmation",
        exitReason: "Target reached, took profits",
        strikePrice: 580,
        playbookId: 1,
        timeClassification: "Cash Open",
        createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.currentTradeId++,
        ticker: "QQQ",
        type: "calls",
        quantity: 3,
        entryPrice: 4.80,
        exitPrice: 4.20,
        entryTime: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000 + 15 * 60 * 1000),
        exitTime: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
        tradeDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        pnl: -180,
        entryReason: "Breakout attempt",
        exitReason: "Failed breakout, cut losses",
        strikePrice: 505,
        playbookId: 2,
        timeClassification: "Power Hour",
        createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.currentTradeId++,
        ticker: "AAPL",
        type: "puts",
        quantity: 2,
        entryPrice: 6.50,
        exitPrice: 4.10,
        entryTime: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000 + 20 * 60 * 1000),
        exitTime: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000 + 45 * 60 * 1000),
        tradeDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        pnl: 480,
        entryReason: "Resistance rejection at key level",
        exitReason: "Target reached, secured profits",
        strikePrice: 230,
        playbookId: 3,
        timeClassification: "Other",
        createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.currentTradeId++,
        ticker: "TSLA",
        type: "calls",
        quantity: 1,
        entryPrice: 8.20,
        exitPrice: 12.50,
        entryTime: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
        exitTime: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000 + 15 * 60 * 1000),
        tradeDate: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
        pnl: 430,
        entryReason: "Gap fill setup with momentum",
        exitReason: "Strong move, took profits",
        strikePrice: 270,
        playbookId: 1,
        timeClassification: "Cash Open",
        createdAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
      }
    ];

    sampleTrades.forEach(trade => {
      this.trades.set(trade.id, trade);
    });

    // Sample premarket analysis
    const samplePremarket: PremarketAnalysis = {
      id: this.currentPremarketId++,
      date: today,
      climateNotes: "Market showing bullish sentiment, low VIX environment",
      hasEconomicEvents: true,
      economicEvents: "CPI data release at 8:30 AM, expecting 0.3% increase",
      economicImpact: "high",
      vixValue: 18.5,
      expectedVolatility: 75,
      gammaEnvironment: "positive",
      bias: "bullish",
      esFuturesLevel: "5820",
      esFuturesLevelType: "hvl",
      esVolumeAnalysis: 80,
      nqFuturesLevel: "20150",
      nqFuturesLevelType: "vwap",
      nqVolumeAnalysis: 70,
      rtyFuturesLevel: "2180",
      rtyFuturesLevelType: "put_support",
      rtyVolumeAnalysis: 65,
      callResistance: "582.50",
      putSupport: "578.20",
      hvlLevel: "580.75",
      vaultLevel: "579.50",
      vwapLevel: "580.15",
      keyLevels: "Support: 578.20, 576.50 | Resistance: 582.50, 585.00 | Key levels to watch today",
      spyAnalysis: "Bullish momentum above HVL, watching for continuation above 582.50 resistance",
      spyCriticalLevel: "580.75",
      spyCriticalLevelType: "hvl",
      spyDirection: "long",
      dpofTrend: "positive",
      dpofVolumeDivergence: false,
      dpofCenterline: "above",
      dpofExpansionDivergence: true,
      dpofAbsorption: false,
      volumeGapExists: true,
      volumeGapRR: "Gap at 579.80, R:R 1:2.5 if filled",
      deltaExposureAnalyzed: true,
      squeezeMomoDirection: "positive",
      isInSqueeze: false,
      bondCorrelation: "trending_inverse",
      tradeIdea1: "SPY 580C for break above HVL with 1:3 R:R targeting 582.50",
      tradeIdea2: "QQQ calls off VWAP support at 501.25, targeting gap fill at 503",
      tradeIdea3: "IWM puts if RTY breaks below 2180 put support, targeting 2175",
      createdAt: today
    };

    this.premarketAnalyses.set(samplePremarket.id, samplePremarket);

    // Sample intraday notes
    const sampleNotes = [
      {
        id: this.currentNoteId++,
        date: new Date(today.getTime() - 2 * 60 * 60 * 1000),
        time: new Date(today.getTime() - 2 * 60 * 60 * 1000),
        note: "Market opening with strong buying pressure, SPY gapping up 0.5%",
        createdAt: new Date(today.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        id: this.currentNoteId++,
        date: new Date(today.getTime() - 1 * 60 * 60 * 1000),
        time: new Date(today.getTime() - 1 * 60 * 60 * 1000),
        note: "Seeing rotation from tech to value stocks, QQQ showing weakness",
        createdAt: new Date(today.getTime() - 1 * 60 * 60 * 1000)
      }
    ];

    sampleNotes.forEach(note => {
      this.intradayNotes.set(note.id, note);
    });

    // Sample trade analysis
    const sampleAnalyses = [
      {
        id: this.currentAnalysisId++,
        tradeId: 1,
        screenshotUrl: null,
        whatWentWell: "Entry timing was perfect, caught the exact VWAP bounce",
        whatToImprove: "Could have held longer for bigger profit",
        nextTime: "Set wider stops to avoid getting shaken out early",
        createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.currentAnalysisId++,
        tradeId: 2,
        screenshotUrl: null,
        whatWentWell: "Quick loss recognition saved capital",
        whatToImprove: "Should have waited for better volume confirmation",
        nextTime: "Look for higher volume on breakout attempts",
        createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
      }
    ];

    sampleAnalyses.forEach(analysis => {
      this.tradeAnalyses.set(analysis.id, analysis);
    });
  }

  // Trades
  async getTrades(): Promise<Trade[]> {
    return Array.from(this.trades.values()).sort((a, b) => b.id - a.id);
  }

  async getTrade(id: number): Promise<Trade | undefined> {
    return this.trades.get(id);
  }

  async getTradesByDate(date: Date): Promise<Trade[]> {
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Array.from(this.trades.values()).filter(trade => {
      const tradeDate = new Date(trade.tradeDate.getFullYear(), trade.tradeDate.getMonth(), trade.tradeDate.getDate());
      return tradeDate.getTime() === targetDate.getTime();
    });
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = this.currentTradeId++;
    
    // Calculate P&L if exit price is provided
    let pnl: number | null = null;
    if (insertTrade.exitPrice) {
      const multiplier = 100; // Options multiplier
      const entryDebit = insertTrade.entryPrice * insertTrade.quantity * multiplier;
      const exitCredit = insertTrade.exitPrice * insertTrade.quantity * multiplier;
      pnl = exitCredit - entryDebit;
    }
    
    // Determine time classification
    let timeClassification = "Other";
    if (insertTrade.entryTime) {
      const hour = insertTrade.entryTime.getHours();
      const minute = insertTrade.entryTime.getMinutes();
      const timeInMinutes = hour * 60 + minute;
      
      if (timeInMinutes >= 510 && timeInMinutes <= 570) { // 8:30-9:30 AM
        timeClassification = "Cash Open";
      } else if (timeInMinutes >= 571 && timeInMinutes <= 630) { // 9:31-10:30 AM
        timeClassification = "Euro Close";
      } else if (timeInMinutes >= 870 && timeInMinutes <= 900) { // 2:30-3:00 PM
        timeClassification = "Power Hour";
      }
    }
    
    const trade: Trade = {
      ...insertTrade,
      id,
      pnl,
      timeClassification,
      exitPrice: insertTrade.exitPrice || null,
      exitTime: insertTrade.exitTime || null,
      entryReason: insertTrade.entryReason || null,
      exitReason: insertTrade.exitReason || null,
      playbookId: insertTrade.playbookId || null,
      tradeDate: insertTrade.tradeDate,
      createdAt: new Date(),
    };
    
    this.trades.set(id, trade);
    return trade;
  }

  async updateTrade(id: number, updateData: Partial<InsertTrade>): Promise<Trade | undefined> {
    const existingTrade = this.trades.get(id);
    if (!existingTrade) return undefined;
    
    const updatedTrade: Trade = { ...existingTrade, ...updateData };
    
    // Recalculate P&L if prices changed
    if (updateData.exitPrice || updateData.entryPrice || updateData.quantity) {
      if (updatedTrade.exitPrice) {
        const multiplier = 100;
        const entryDebit = updatedTrade.entryPrice * updatedTrade.quantity * multiplier;
        const exitCredit = updatedTrade.exitPrice * updatedTrade.quantity * multiplier;
        updatedTrade.pnl = exitCredit - entryDebit;
      }
    }
    
    this.trades.set(id, updatedTrade);
    return updatedTrade;
  }

  async deleteTrade(id: number): Promise<boolean> {
    return this.trades.delete(id);
  }

  // Premarket Analysis
  async getPremarketAnalysis(): Promise<PremarketAnalysis[]> {
    return Array.from(this.premarketAnalyses.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getPremarketAnalysisByDate(date: Date): Promise<PremarketAnalysis | undefined> {
    const dateStr = date.toDateString();
    return Array.from(this.premarketAnalyses.values()).find(
      analysis => analysis.date.toDateString() === dateStr
    );
  }

  async createPremarketAnalysis(insertAnalysis: InsertPremarketAnalysis): Promise<PremarketAnalysis> {
    const id = this.currentPremarketId++;
    const analysis: PremarketAnalysis = {
      ...insertAnalysis,
      id,
      climateNotes: insertAnalysis.climateNotes || null,
      hasEconomicEvents: insertAnalysis.hasEconomicEvents || false,
      economicEvents: insertAnalysis.economicEvents || null,
      economicImpact: insertAnalysis.economicImpact || null,
      vixValue: insertAnalysis.vixValue || null,
      expectedVolatility: insertAnalysis.expectedVolatility || null,
      gammaEnvironment: insertAnalysis.gammaEnvironment || null,
      bias: insertAnalysis.bias || null,
      esFuturesLevel: insertAnalysis.esFuturesLevel || null,
      esFuturesLevelType: insertAnalysis.esFuturesLevelType || null,
      esVolumeAnalysis: insertAnalysis.esVolumeAnalysis || null,
      nqFuturesLevel: insertAnalysis.nqFuturesLevel || null,
      nqFuturesLevelType: insertAnalysis.nqFuturesLevelType || null,
      nqVolumeAnalysis: insertAnalysis.nqVolumeAnalysis || null,
      rtyFuturesLevel: insertAnalysis.rtyFuturesLevel || null,
      rtyFuturesLevelType: insertAnalysis.rtyFuturesLevelType || null,
      rtyVolumeAnalysis: insertAnalysis.rtyVolumeAnalysis || null,
      callResistance: insertAnalysis.callResistance ? String(insertAnalysis.callResistance) : null,
      putSupport: insertAnalysis.putSupport ? String(insertAnalysis.putSupport) : null,
      hvlLevel: insertAnalysis.hvlLevel ? String(insertAnalysis.hvlLevel) : null,
      vaultLevel: insertAnalysis.vaultLevel ? String(insertAnalysis.vaultLevel) : null,
      vwapLevel: insertAnalysis.vwapLevel ? String(insertAnalysis.vwapLevel) : null,
      keyLevels: insertAnalysis.keyLevels || null,
      spyAnalysis: insertAnalysis.spyAnalysis || null,
      spyCriticalLevel: insertAnalysis.spyCriticalLevel?.toString() || null,
      spyCriticalLevelType: insertAnalysis.spyCriticalLevelType || null,
      spyDirection: insertAnalysis.spyDirection || null,
      dpofTrend: insertAnalysis.dpofTrend || null,
      dpofVolumeDivergence: insertAnalysis.dpofVolumeDivergence || false,
      dpofCenterline: insertAnalysis.dpofCenterline || null,
      dpofExpansionDivergence: insertAnalysis.dpofExpansionDivergence || false,
      dpofAbsorption: insertAnalysis.dpofAbsorption || false,
      volumeGapExists: insertAnalysis.volumeGapExists || false,
      volumeGapRR: insertAnalysis.volumeGapRR || null,
      deltaExposureAnalyzed: insertAnalysis.deltaExposureAnalyzed ?? false,
      squeezeMomoDirection: insertAnalysis.squeezeMomoDirection || null,
      isInSqueeze: insertAnalysis.isInSqueeze ?? false,
      bondCorrelation: insertAnalysis.bondCorrelation || null,
      tradeIdea1: insertAnalysis.tradeIdea1 || null,
      tradeIdea2: insertAnalysis.tradeIdea2 || null,
      tradeIdea3: insertAnalysis.tradeIdea3 || null,
      createdAt: new Date(),
    };
    this.premarketAnalyses.set(id, analysis);
    return analysis;
  }

  async updatePremarketAnalysis(id: number, updateData: Partial<InsertPremarketAnalysis>): Promise<PremarketAnalysis | undefined> {
    const existing = this.premarketAnalyses.get(id);
    if (!existing) return undefined;
    
    // Convert number fields to strings for database compatibility
    const processedUpdateData: any = { ...updateData };
    if (updateData.callResistance !== undefined) {
      processedUpdateData.callResistance = updateData.callResistance ? String(updateData.callResistance) : null;
    }
    if (updateData.putSupport !== undefined) {
      processedUpdateData.putSupport = updateData.putSupport ? String(updateData.putSupport) : null;
    }
    if (updateData.hvlLevel !== undefined) {
      processedUpdateData.hvlLevel = updateData.hvlLevel ? String(updateData.hvlLevel) : null;
    }
    if (updateData.vaultLevel !== undefined) {
      processedUpdateData.vaultLevel = updateData.vaultLevel ? String(updateData.vaultLevel) : null;
    }
    if (updateData.vwapLevel !== undefined) {
      processedUpdateData.vwapLevel = updateData.vwapLevel ? String(updateData.vwapLevel) : null;
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
    return Array.from(this.tradeAnalyses.values()).find(
      analysis => analysis.tradeId === tradeId
    );
  }

  async createTradeAnalysis(insertAnalysis: InsertTradeAnalysis): Promise<TradeAnalysis> {
    const id = this.currentAnalysisId++;
    const analysis: TradeAnalysis = {
      ...insertAnalysis,
      id,
      screenshotUrl: insertAnalysis.screenshotUrl || null,
      whatWentWell: insertAnalysis.whatWentWell || null,
      whatToImprove: insertAnalysis.whatToImprove || null,
      nextTime: insertAnalysis.nextTime || null,
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
    return Array.from(this.playbookStrategies.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async createPlaybookStrategy(insertStrategy: InsertPlaybookStrategy): Promise<PlaybookStrategy> {
    const id = this.currentStrategyId++;
    const strategy: PlaybookStrategy = {
      ...insertStrategy,
      id,
      description: insertStrategy.description || null,
      isDefault: insertStrategy.isDefault || null,
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
    const strategy = this.playbookStrategies.get(id);
    if (strategy?.isDefault) {
      return false; // Don't allow deletion of default strategies
    }
    return this.playbookStrategies.delete(id);
  }

  // Intraday Notes
  async getIntradayNotes(): Promise<IntradayNote[]> {
    return Array.from(this.intradayNotes.values()).sort((a, b) => b.time.getTime() - a.time.getTime());
  }

  async getIntradayNotesByDate(date: Date): Promise<IntradayNote[]> {
    const dateStr = date.toDateString();
    return Array.from(this.intradayNotes.values()).filter(
      note => note.date.toDateString() === dateStr
    ).sort((a, b) => b.time.getTime() - a.time.getTime());
  }

  async createIntradayNote(insertNote: InsertIntradayNote): Promise<IntradayNote> {
    const id = this.currentNoteId++;
    const note: IntradayNote = {
      ...insertNote,
      id,
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

  // Clear all data
  async clearAllData(): Promise<boolean> {
    try {
      this.trades.clear();
      this.premarketAnalyses.clear();
      this.tradeAnalyses.clear();
      this.intradayNotes.clear();
      
      // Reset only non-default strategies
      const defaultStrategies = Array.from(this.playbookStrategies.values()).filter(s => s.isDefault);
      this.playbookStrategies.clear();
      defaultStrategies.forEach(strategy => {
        this.playbookStrategies.set(strategy.id, strategy);
      });
      
      // Reset counters
      this.currentTradeId = 1;
      this.currentPremarketId = 1;
      this.currentAnalysisId = 1;
      this.currentNoteId = 1;
      // Keep strategy counter to avoid conflicts with existing default strategies
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private initializeDefaultSettings() {
    // Initialize account balance setting
    const accountBalanceSetting: Settings = {
      id: this.currentSettingId++,
      key: 'account_balance',
      value: '28000',
      updatedAt: new Date(),
    };
    this.settings.set('account_balance', accountBalanceSetting);
  }

  async getSetting(key: string): Promise<Settings | undefined> {
    return this.settings.get(key);
  }

  async setSetting(key: string, value: string): Promise<Settings> {
    const existing = this.settings.get(key);
    
    if (existing) {
      const updated: Settings = {
        ...existing,
        value,
        updatedAt: new Date(),
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
}

export const storage = new MemStorage();

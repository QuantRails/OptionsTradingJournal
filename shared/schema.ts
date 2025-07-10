import { pgTable, text, serial, integer, real, timestamp, boolean, json, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// User storage table for authentication
export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  ticker: text("ticker").notNull(),
  type: text("type").notNull(), // 'calls' or 'puts'
  quantity: integer("quantity").notNull(),
  entryPrice: real("entry_price").notNull(),
  exitPrice: real("exit_price"),
  entryTime: timestamp("entry_time").notNull(),
  exitTime: timestamp("exit_time"),
  strikePrice: real("strike_price").notNull(),
  expirationDate: timestamp("expiration_date").notNull(),
  pnl: real("pnl"),
  entryReason: text("entry_reason"),
  exitReason: text("exit_reason"),
  playbookId: integer("playbook_id"),
  timeClassification: text("time_classification"), // 'Cash Open', 'Euro Close', 'Power Hour', 'Other'
  tradeDate: timestamp("trade_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const premarketAnalysis = pgTable("premarket_analysis", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  climateNotes: text("climate_notes"),
  
  // Economic Events
  hasEconomicEvents: boolean("has_economic_events").default(false),
  economicEvents: text("economic_events"),
  economicImpact: text("economic_impact"), // 'high', 'medium', 'low'
  
  // VIX Analysis
  vixValue: real("vix_value"),
  expectedVolatility: integer("expected_volatility"), // 1-100
  gammaEnvironment: text("gamma_environment"), // 'positive' or 'negative'
  bias: text("bias"), // 'bullish', 'bearish', 'neutral'
  
  // Futures Analysis
  esFuturesLevel: text("es_futures_level"),
  esFuturesLevelType: text("es_futures_level_type"), // 'call_resistance', 'put_support', 'hvl', 'vwap', 'other'
  esVolumeAnalysis: integer("es_volume_analysis"), // 1-100
  nqFuturesLevel: text("nq_futures_level"),
  nqFuturesLevelType: text("nq_futures_level_type"),
  nqVolumeAnalysis: integer("nq_volume_analysis"), // 1-100
  rtyFuturesLevel: text("rty_futures_level"),
  rtyFuturesLevelType: text("rty_futures_level_type"),
  rtyVolumeAnalysis: integer("rty_volume_analysis"), // 1-100
  
  // SPY Key Levels Analysis
  callResistance: text("call_resistance"),
  putSupport: text("put_support"),
  hvlLevel: text("hvl_level"),
  vaultLevel: text("vault_level"),
  vwapLevel: text("vwap_level"),
  keyLevels: text("key_levels"),
  spyAnalysis: text("spy_analysis"),
  
  // SPY Analysis
  spyCriticalLevel: text("spy_critical_level"),
  spyCriticalLevelType: text("spy_critical_level_type"), // 'call_resistance', 'put_support', 'hvl', 'vault_level', 'vwap', 'other'
  spyDirection: text("spy_direction"), // 'long' or 'short'
  
  // DPOF Analysis
  dpofTrend: text("dpof_trend"), // 'positive' or 'negative'
  dpofVolumeDivergence: boolean("dpof_volume_divergence").default(false),
  dpofCenterline: text("dpof_centerline"), // 'above' or 'below'
  dpofExpansionDivergence: boolean("dpof_expansion_divergence").default(false),
  dpofAbsorption: boolean("dpof_absorption").default(false),
  
  // Volume Gap Analysis
  volumeGapExists: boolean("volume_gap_exists").default(false),
  volumeGapRR: text("volume_gap_rr"),
  
  // SPY Gamma Exposure
  deltaExposureAnalyzed: boolean("delta_exposure_analyzed").default(false),
  
  // Momentum Analysis
  squeezeMomoDirection: text("squeeze_momo_direction"), // 'positive' or 'negative'
  isInSqueeze: boolean("is_in_squeeze").default(false),
  
  // Bond Market Analysis
  bondCorrelation: text("bond_correlation"), // 'trending_with', 'trending_inverse', 'no_correlation'
  
  // Trade Ideas
  tradeIdea1: text("trade_idea_1"),
  tradeIdea2: text("trade_idea_2"),
  tradeIdea3: text("trade_idea_3"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tradeAnalysis = pgTable("trade_analysis", {
  id: serial("id").primaryKey(),
  tradeId: integer("trade_id").notNull(),
  screenshotUrl: text("screenshot_url"),
  whatWentWell: text("what_went_well"),
  whatToImprove: text("what_to_improve"),
  nextTime: text("next_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const intradayNotes = pgTable("intraday_notes", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  time: timestamp("time").notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const playbookStrategies = pgTable("playbook_strategies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  createdAt: true,
}).extend({
  entryTime: z.coerce.date(),
  exitTime: z.coerce.date().optional(),
  expirationDate: z.coerce.date(),
  tradeDate: z.coerce.date(),
  pnl: z.coerce.number().optional(),
  exitPrice: z.coerce.number().optional(),
  playbookId: z.coerce.number().optional(),
  usePlaybook: z.boolean().optional(),
});

export const insertPremarketAnalysisSchema = createInsertSchema(premarketAnalysis).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.coerce.date(),
  vixValue: z.coerce.number().optional(),
  expectedVolatility: z.coerce.number().optional(),
  esVolumeAnalysis: z.coerce.number().optional(),
  nqVolumeAnalysis: z.coerce.number().optional(),
  rtyVolumeAnalysis: z.coerce.number().optional(),
  callResistance: z.string().optional().nullable(),
  putSupport: z.string().optional().nullable(),
  hvlLevel: z.string().optional().nullable(),
  vaultLevel: z.string().optional().nullable(),
  vwapLevel: z.string().optional().nullable(),
  spyCriticalLevel: z.string().optional(),
});

export const insertTradeAnalysisSchema = createInsertSchema(tradeAnalysis).omit({
  id: true,
  createdAt: true,
});

export const insertPlaybookStrategySchema = createInsertSchema(playbookStrategies).omit({
  id: true,
  createdAt: true,
});

export const insertIntradayNoteSchema = createInsertSchema(intradayNotes).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.coerce.date(),
  time: z.coerce.date(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type PremarketAnalysis = typeof premarketAnalysis.$inferSelect;
export type InsertPremarketAnalysis = z.infer<typeof insertPremarketAnalysisSchema>;
export type TradeAnalysis = typeof tradeAnalysis.$inferSelect;
export type InsertTradeAnalysis = z.infer<typeof insertTradeAnalysisSchema>;
export type PlaybookStrategy = typeof playbookStrategies.$inferSelect;
export type InsertPlaybookStrategy = z.infer<typeof insertPlaybookStrategySchema>;
export type IntradayNote = typeof intradayNotes.$inferSelect;
export type InsertIntradayNote = z.infer<typeof insertIntradayNoteSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// User types for authentication
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

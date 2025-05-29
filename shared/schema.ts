import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  licenseType: text("license_type"), // 'definitiva', 'mensal', null
  licenseStatus: text("license_status").default("inactive"), // 'active', 'inactive', 'expired'
  licenseExpiresAt: timestamp("license_expires_at"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const licenses = pgTable("licenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'definitiva', 'mensal', 'pay_per_gain'
  status: text("status").notNull(), // 'active', 'inactive', 'expired', 'cancelled'
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("BRL"),
  paymentMethod: text("payment_method"), // 'stripe', 'pix', 'pix_auto'
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  activatedAt: timestamp("activated_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gainPayments = pgTable("gain_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tradeId: integer("trade_id").notNull().references(() => trades.id),
  gainAmount: decimal("gain_amount", { precision: 10, scale: 2 }).notNull(),
  feePercentage: decimal("fee_percentage", { precision: 5, scale: 3 }).default("0.5"),
  feeAmount: decimal("fee_amount", { precision: 10, scale: 2 }).notNull(),
  pixDestination: text("pix_destination").notNull(), // jbm5688@hotmail.com
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'processing', 'completed', 'failed'
  pixTransactionId: text("pix_transaction_id"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  pair: text("pair").notNull(), // EUR/USD, GBP/USD, etc.
  direction: text("direction").notNull(), // CALL or PUT
  entryAmount: decimal("entry_amount", { precision: 10, scale: 2 }).notNull(),
  timeframe: integer("timeframe").notNull(), // in seconds
  entryPrice: decimal("entry_price", { precision: 10, scale: 5 }),
  exitPrice: decimal("exit_price", { precision: 10, scale: 5 }),
  result: text("result"), // WIN, LOSS, or null for active
  payout: decimal("payout", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  isMartingale: boolean("is_martingale").default(false),
  parentTradeId: integer("parent_trade_id"),
  entryTime: timestamp("entry_time").defaultNow(),
  exitTime: timestamp("exit_time"),
});

export const marketData = pgTable("market_data", {
  id: serial("id").primaryKey(),
  pair: text("pair").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  open: decimal("open", { precision: 10, scale: 5 }).notNull(),
  high: decimal("high", { precision: 10, scale: 5 }).notNull(),
  low: decimal("low", { precision: 10, scale: 5 }).notNull(),
  close: decimal("close", { precision: 10, scale: 5 }).notNull(),
  volume: integer("volume").notNull(),
});

export const botSettings = pgTable("bot_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  isActive: boolean("is_active").default(false),
  initialAmount: decimal("initial_amount", { precision: 10, scale: 2 }).default("20.00"),
  primaryTimeframe: integer("primary_timeframe").default(60),
  secondaryTimeframe: integer("secondary_timeframe").default(10),
  multiplier: integer("multiplier").default(10),
  maxDailyLoss: decimal("max_daily_loss", { precision: 10, scale: 2 }).default("500.00"),
  riskManagement: boolean("risk_management").default(true),
});

export const signals = pgTable("signals", {
  id: serial("id").primaryKey(),
  pair: text("pair").notNull(),
  direction: text("direction").notNull(),
  strength: integer("strength").notNull(), // 0-100
  indicators: text("indicators").notNull(), // JSON string of indicator values
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  licenseStatus: true,
  licenseExpiresAt: true,
});

export const insertLicenseSchema = createInsertSchema(licenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  currency: z.string().default("BRL"),
  paymentMethod: z.string().nullable().optional(),
  stripePaymentIntentId: z.string().nullable().optional(),
  stripeSubscriptionId: z.string().nullable().optional(),
  activatedAt: z.date().nullable().optional(),
  expiresAt: z.date().nullable().optional(),
});

export const insertGainPaymentSchema = createInsertSchema(gainPayments).omit({
  id: true,
  createdAt: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  entryTime: true,
  exitTime: true,
});

export const insertMarketDataSchema = createInsertSchema(marketData).omit({
  id: true,
  timestamp: true,
});

export const insertBotSettingsSchema = createInsertSchema(botSettings).omit({
  id: true,
});

export const insertSignalSchema = createInsertSchema(signals).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type License = typeof licenses.$inferSelect;
export type InsertLicense = z.infer<typeof insertLicenseSchema>;

export type GainPayment = typeof gainPayments.$inferSelect;
export type InsertGainPayment = z.infer<typeof insertGainPaymentSchema>;

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;

export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;

export type BotSettings = typeof botSettings.$inferSelect;
export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;

export type Signal = typeof signals.$inferSelect;
export type InsertSignal = z.infer<typeof insertSignalSchema>;

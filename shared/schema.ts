import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, jsonb, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().unique(),
  country: text("country").notNull(),
  password: text("password").notNull(),
  isEmailVerified: boolean("is_email_verified").default(false),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  kycStatus: text("kyc_status").default("not_submitted"), // not_submitted, pending, verified, rejected
  hasVirtualCard: boolean("has_virtual_card").default(false),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  biometricEnabled: boolean("biometric_enabled").default(false),
  pushNotificationsEnabled: boolean("push_notifications_enabled").default(true),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00"),
  otpCode: text("otp_code"),
  otpExpiry: timestamp("otp_expiry"),
  paystackCustomerId: text("paystack_customer_id"),
  defaultCurrency: text("default_currency").default("KES"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const kycDocuments = pgTable("kyc_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  documentType: text("document_type").notNull(), // national_id, passport, drivers_license
  frontImageUrl: text("front_image_url"),
  backImageUrl: text("back_image_url"),
  selfieUrl: text("selfie_url"),
  dateOfBirth: text("date_of_birth"),
  address: text("address"),
  status: text("status").default("pending"),
  verificationNotes: text("verification_notes"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const virtualCards = pgTable("virtual_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  cardNumber: text("card_number").notNull(),
  expiryDate: text("expiry_date").notNull(),
  cvv: text("cvv").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00"),
  status: text("status").default("active"), // active, frozen, expired
  purchaseAmount: decimal("purchase_amount", { precision: 10, scale: 2 }).default("60.00"),
  paystackReference: text("paystack_reference"),
  purchaseDate: timestamp("purchase_date").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // send, receive, deposit, withdraw, card_purchase
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  recipientId: varchar("recipient_id").references(() => users.id),
  recipientDetails: jsonb("recipient_details"), // name, phone, email, bank details
  status: text("status").default("pending"), // pending, processing, completed, failed, cancelled
  fee: decimal("fee", { precision: 10, scale: 2 }).default("0.00"),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  description: text("description"),
  reference: text("reference"),
  paystackReference: text("paystack_reference"),
  metadata: jsonb("metadata"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recipients = pgTable("recipients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  accountNumber: text("account_number"),
  bankName: text("bank_name"),
  bankCode: text("bank_code"),
  country: text("country").notNull(),
  currency: text("currency").notNull().default("KES"),
  recipientType: text("recipient_type").default("mobile_wallet"), // bank, mobile_wallet, cash_pickup
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentRequests = pgTable("payment_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").references(() => users.id).notNull(),
  recipientId: varchar("recipient_id").references(() => recipients.id),
  toEmail: text("to_email"),
  toPhone: text("to_phone"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("KES"),
  message: text("message"),
  paymentLink: text("payment_link"),
  status: text("status").default("pending"), // pending, paid, expired
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table for system-wide notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("info"), // info, success, warning, error
  isGlobal: boolean("is_global").default(false), // true for admin broadcasts
  userId: varchar("user_id").references(() => users.id), // null for global notifications
  isRead: boolean("is_read").default(false),
  actionUrl: text("action_url"),
  metadata: jsonb("metadata"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  kycStatus: true,
  hasVirtualCard: true,
  createdAt: true,
});

export const insertKycDocumentSchema = createInsertSchema(kycDocuments).omit({
  id: true,
  status: true,
  createdAt: true,
});

export const insertVirtualCardSchema = createInsertSchema(virtualCards).omit({
  id: true,
  cardNumber: true,
  expiryDate: true,
  cvv: true,
  balance: true,
  status: true,
  purchaseDate: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertRecipientSchema = createInsertSchema(recipients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentRequestSchema = createInsertSchema(paymentRequests).omit({
  id: true,
  status: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type KycDocument = typeof kycDocuments.$inferSelect;
export type InsertKycDocument = z.infer<typeof insertKycDocumentSchema>;
export type VirtualCard = typeof virtualCards.$inferSelect;
export type InsertVirtualCard = z.infer<typeof insertVirtualCardSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Recipient = typeof recipients.$inferSelect;
export type InsertRecipient = z.infer<typeof insertRecipientSchema>;
export type PaymentRequest = typeof paymentRequests.$inferSelect;
export type InsertPaymentRequest = z.infer<typeof insertPaymentRequestSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Admin schema
export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("admin"),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  lastLoginAt: timestamp("last_login_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin activity logs
export const adminLogs = pgTable("admin_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => admins.id),
  action: text("action").notNull(),
  targetType: text("target_type"), // user, transaction, kyc, etc.
  targetId: text("target_id"),
  details: json("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemLogs = pgTable("system_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  level: text("level").notNull(), // info, warn, error, debug, api
  message: text("message").notNull(),
  source: text("source"),
  data: json("data"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// System settings
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // fees, limits, currencies, etc.
  key: text("key").notNull(),
  value: json("value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => admins.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Admin = typeof admins.$inferSelect;
export type AdminLog = typeof adminLogs.$inferSelect;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type SystemLog = typeof systemLogs.$inferSelect;

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;

// Enhanced Features Tables
export const savingsGoals = pgTable("savings_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 10, scale: 2 }).default("0.00"),
  targetDate: timestamp("target_date"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const qrPayments = pgTable("qr_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  paymentCode: text("payment_code").notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const scheduledPayments = pgTable("scheduled_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  recipientId: varchar("recipient_id").references(() => recipients.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  frequency: text("frequency").notNull(), // daily, weekly, monthly, yearly
  nextPaymentDate: timestamp("next_payment_date").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastPaymentAt: timestamp("last_payment_at"),
  totalPaymentsMade: text("total_payments_made").notNull().default("0"),
});

export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  category: text("category").notNull(),
  budgetAmount: decimal("budget_amount", { precision: 10, scale: 2 }).notNull(),
  spentAmount: decimal("spent_amount", { precision: 10, scale: 2 }).default("0.00"),
  period: text("period").notNull(), // monthly, weekly, yearly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  alertThreshold: text("alert_threshold").default("80"), // Alert when 80% of budget is spent
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  theme: text("theme").default("light"), // light, dark, auto
  language: text("language").default("en"),
  biometricEnabled: boolean("biometric_enabled").default(false),
  transactionLimit: decimal("transaction_limit", { precision: 10, scale: 2 }).default("1000.00"),
  dailyLimit: decimal("daily_limit", { precision: 10, scale: 2 }).default("5000.00"),
  monthlyLimit: decimal("monthly_limit", { precision: 10, scale: 2 }).default("50000.00"),
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(true),
  marketingEmails: boolean("marketing_emails").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for new tables
export const insertSavingsGoalSchema = createInsertSchema(savingsGoals).omit({
  id: true,
  currentAmount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQRPaymentSchema = createInsertSchema(qrPayments).omit({
  id: true,
  paymentCode: true,
  createdAt: true,
  processedAt: true,
});

export const insertScheduledPaymentSchema = createInsertSchema(scheduledPayments).omit({
  id: true,
  createdAt: true,
  lastPaymentAt: true,
  totalPaymentsMade: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  spentAmount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for new tables
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;
export type QRPayment = typeof qrPayments.$inferSelect;
export type InsertQRPayment = z.infer<typeof insertQRPaymentSchema>;
export type ScheduledPayment = typeof scheduledPayments.$inferSelect;
export type InsertScheduledPayment = z.infer<typeof insertScheduledPaymentSchema>;
export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

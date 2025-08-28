import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
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
  kycStatus: text("kyc_status").default("pending"), // pending, submitted, verified, rejected
  hasVirtualCard: boolean("has_virtual_card").default(false),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  biometricEnabled: boolean("biometric_enabled").default(false),
  pushNotificationsEnabled: boolean("push_notifications_enabled").default(true),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00"),
  otpCode: text("otp_code"),
  otpExpiry: timestamp("otp_expiry"),
  paystackCustomerId: text("paystack_customer_id"),
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

export const paymentRequests = pgTable("payment_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").references(() => users.id).notNull(),
  toEmail: text("to_email"),
  toPhone: text("to_phone"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  message: text("message"),
  status: text("status").default("pending"), // pending, paid, expired
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
  status: true,
  createdAt: true,
});

export const insertPaymentRequestSchema = createInsertSchema(paymentRequests).omit({
  id: true,
  status: true,
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
export type PaymentRequest = typeof paymentRequests.$inferSelect;
export type InsertPaymentRequest = z.infer<typeof insertPaymentRequestSchema>;

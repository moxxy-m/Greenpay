import {
  type User,
  type InsertUser,
  type KycDocument,
  type InsertKycDocument,
  type VirtualCard,
  type InsertVirtualCard,
  type Transaction,
  type InsertTransaction,
  type PaymentRequest,
  type InsertPaymentRequest,
  type Recipient,
  type InsertRecipient,
  type Notification,
  type InsertNotification,
  type Admin,
  type InsertAdmin,
  type AdminLog,
  type InsertAdminLog,
  type SystemSetting,
  type InsertSystemSetting,
  users,
  kycDocuments,
  virtualCards,
  transactions,
  paymentRequests,
  recipients,
  notifications,
  admins,
  adminLogs,
  systemSettings,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, count, sum, or, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserOtp(id: string, otpCode: string, otpExpiry: Date): Promise<User | undefined>;
  verifyUserOtp(id: string, otpCode: string): Promise<boolean>;

  // KYC operations
  createKycDocument(kyc: InsertKycDocument): Promise<KycDocument>;
  getKycByUserId(userId: string): Promise<KycDocument | undefined>;
  updateKycDocument(id: string, updates: Partial<KycDocument>): Promise<KycDocument | undefined>;

  // Virtual Card operations
  createVirtualCard(card: InsertVirtualCard): Promise<VirtualCard>;
  getVirtualCardByUserId(userId: string): Promise<VirtualCard | undefined>;
  updateVirtualCard(id: string, updates: Partial<VirtualCard>): Promise<VirtualCard | undefined>;

  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByUserId(userId: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;

  // Recipient operations
  createRecipient(recipient: InsertRecipient): Promise<Recipient>;
  getRecipientsByUserId(userId: string): Promise<Recipient[]>;
  getRecipient(id: string): Promise<Recipient | undefined>;
  updateRecipient(id: string, updates: Partial<Recipient>): Promise<Recipient | undefined>;
  deleteRecipient(id: string): Promise<void>;

  // Payment Request operations
  createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest>;
  getPaymentRequestsByUserId(userId: string): Promise<PaymentRequest[]>;
  getPaymentRequest(id: string): Promise<PaymentRequest | undefined>;
  updatePaymentRequest(id: string, updates: Partial<PaymentRequest>): Promise<PaymentRequest | undefined>;

  // Admin operations
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  getAllUsers(filters?: { status?: string; search?: string; page?: number; limit?: number }): Promise<{ users: User[]; total: number; page: number; totalPages: number }>;
  getAllKycDocuments(): Promise<KycDocument[]>;
  getAllTransactions(filters?: { status?: string; page?: number; limit?: number }): Promise<{ transactions: Transaction[]; total: number; page: number; totalPages: number }>;
  getAllVirtualCards(): Promise<VirtualCard[]>;
  getDashboardMetrics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    pendingKyc: number;
    totalTransactions: number;
    totalVolume: string;
    monthlyGrowth: number;
  }>;
  createAdminLog(log: InsertAdminLog): Promise<AdminLog>;
  getAdminLogs(): Promise<AdminLog[]>;
  
  // System Settings operations
  getSystemSettings(): Promise<SystemSetting[]>;
  updateSystemSetting(key: string, value: string): Promise<SystemSetting | undefined>;
  createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  updateAdmin(id: string, updates: Partial<Admin>): Promise<Admin | undefined>;
  
  // Admin data operations
  getAllUsers(): Promise<User[]>;
  getAllTransactions(): Promise<Transaction[]>;
  getAllKycDocuments(): Promise<KycDocument[]>;
  getAllVirtualCards(): Promise<VirtualCard[]>;
  getUsersCount(): Promise<number>;
  getTransactionsCount(): Promise<number>;
  getTotalVolume(): Promise<{ volume: number; revenue: number }>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUserId(userId: string): Promise<Notification[]>;
  getGlobalNotifications(): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  
  // System settings
  getSystemSetting(category: string, key: string): Promise<SystemSetting | undefined>;
  setSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  updateSystemSetting(id: string, updates: Partial<SystemSetting>): Promise<SystemSetting | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private kycDocuments: Map<string, KycDocument> = new Map();
  private virtualCards: Map<string, VirtualCard> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private paymentRequests: Map<string, PaymentRequest> = new Map();

  constructor() {
    // Initialize with mock data for demo
    this.initMockData();
  }

  private initMockData() {
    // Create demo user
    const demoUser: User = {
      id: "demo-user-1",
      fullName: "John Doe",
      email: "john.doe@email.com",
      phone: "+15551234567",
      country: "United States",
      password: "hashedpassword",
      isEmailVerified: true,
      isPhoneVerified: true,
      kycStatus: "verified",
      hasVirtualCard: true,
      createdAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    // Create demo virtual card
    const demoCard: VirtualCard = {
      id: "demo-card-1",
      userId: demoUser.id,
      cardNumber: "4567123456784567",
      expiryDate: "12/27",
      cvv: "123",
      balance: "2847.65",
      status: "active",
      purchaseDate: new Date(),
    };
    this.virtualCards.set(demoCard.id, demoCard);

    // Create demo transactions
    const transactions: Transaction[] = [
      {
        id: "txn-1",
        userId: demoUser.id,
        type: "send",
        amount: "150.00",
        currency: "USD",
        recipientId: null,
        recipientDetails: { name: "Mary Okafor", phone: "+2348031234567", country: "Nigeria" },
        status: "completed",
        fee: "2.99",
        exchangeRate: "820.0000",
        description: "Sent to Mary Okafor",
        createdAt: new Date(),
      },
      {
        id: "txn-2",
        userId: demoUser.id,
        type: "receive",
        amount: "85.50",
        currency: "USD",
        recipientId: null,
        recipientDetails: { name: "James Kone", email: "james@email.com", country: "Ghana" },
        status: "completed",
        fee: "0.00",
        exchangeRate: null,
        description: "Received from James Kone",
        createdAt: new Date(Date.now() - 86400000), // Yesterday
      },
      {
        id: "txn-3",
        userId: demoUser.id,
        type: "deposit",
        amount: "500.00",
        currency: "USD",
        recipientId: null,
        recipientDetails: null,
        status: "completed",
        fee: "0.00",
        exchangeRate: null,
        description: "Card Top-up",
        createdAt: new Date(Date.now() - 432000000), // 5 days ago
      },
    ];

    transactions.forEach(txn => this.transactions.set(txn.id, txn));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phone === phone);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      isEmailVerified: false,
      isPhoneVerified: false,
      kycStatus: "pending",
      hasVirtualCard: false,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // KYC operations
  async createKycDocument(insertKyc: InsertKycDocument): Promise<KycDocument> {
    const id = randomUUID();
    const kyc: KycDocument = {
      ...insertKyc,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.kycDocuments.set(id, kyc);
    return kyc;
  }

  async getKycByUserId(userId: string): Promise<KycDocument | undefined> {
    return Array.from(this.kycDocuments.values()).find(kyc => kyc.userId === userId);
  }

  async updateKycDocument(id: string, updates: Partial<KycDocument>): Promise<KycDocument | undefined> {
    const kyc = this.kycDocuments.get(id);
    if (!kyc) return undefined;
    
    const updatedKyc = { ...kyc, ...updates };
    this.kycDocuments.set(id, updatedKyc);
    return updatedKyc;
  }

  // Virtual Card operations
  async createVirtualCard(insertCard: InsertVirtualCard): Promise<VirtualCard> {
    const id = randomUUID();
    const card: VirtualCard = {
      ...insertCard,
      id,
      cardNumber: this.generateCardNumber(),
      expiryDate: "12/27",
      cvv: this.generateCVV(),
      balance: "0.00",
      status: "active",
      purchaseDate: new Date(),
    };
    this.virtualCards.set(id, card);
    return card;
  }

  async getVirtualCardByUserId(userId: string): Promise<VirtualCard | undefined> {
    return Array.from(this.virtualCards.values()).find(card => card.userId === userId);
  }

  async updateVirtualCard(id: string, updates: Partial<VirtualCard>): Promise<VirtualCard | undefined> {
    const card = this.virtualCards.get(id);
    if (!card) return undefined;
    
    const updatedCard = { ...card, ...updates };
    this.virtualCards.set(id, updatedCard);
    return updatedCard;
  }

  // Transaction operations
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(txn => txn.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...updates };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  // Payment Request operations
  async createPaymentRequest(insertRequest: InsertPaymentRequest): Promise<PaymentRequest> {
    const id = randomUUID();
    const request: PaymentRequest = {
      ...insertRequest,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.paymentRequests.set(id, request);
    return request;
  }

  async getPaymentRequestsByUserId(userId: string): Promise<PaymentRequest[]> {
    return Array.from(this.paymentRequests.values())
      .filter(req => req.fromUserId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async updatePaymentRequest(id: string, updates: Partial<PaymentRequest>): Promise<PaymentRequest | undefined> {
    const request = this.paymentRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest = { ...request, ...updates };
    this.paymentRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  private generateCardNumber(): string {
    return "4567" + Math.random().toString().slice(2, 14);
  }

  private generateCVV(): string {
    return Math.floor(Math.random() * 900 + 100).toString();
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserOtp(id: string, otpCode: string, otpExpiry: Date): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ otpCode, otpExpiry, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async verifyUserOtp(id: string, otpCode: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user || !user.otpCode || !user.otpExpiry) return false;
    
    const now = new Date();
    const isExpired = now > user.otpExpiry;
    const isValid = user.otpCode === otpCode;
    
    if (isValid && !isExpired) {
      // Clear OTP after successful verification
      await db
        .update(users)
        .set({ otpCode: null, otpExpiry: null, isPhoneVerified: true, updatedAt: new Date() })
        .where(eq(users.id, id));
      return true;
    }
    
    return false;
  }

  // KYC operations
  async createKycDocument(insertKyc: InsertKycDocument): Promise<KycDocument> {
    const [kyc] = await db
      .insert(kycDocuments)
      .values(insertKyc)
      .returning();
    return kyc;
  }

  async getKycByUserId(userId: string): Promise<KycDocument | undefined> {
    const [kyc] = await db.select().from(kycDocuments).where(eq(kycDocuments.userId, userId));
    return kyc || undefined;
  }

  async updateKycDocument(id: string, updates: Partial<KycDocument>): Promise<KycDocument | undefined> {
    const [kyc] = await db
      .update(kycDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(kycDocuments.id, id))
      .returning();
    return kyc || undefined;
  }

  // Virtual Card operations
  async createVirtualCard(insertCard: InsertVirtualCard): Promise<VirtualCard> {
    const cardNumber = this.generateCardNumber();
    const cvv = this.generateCVV();
    const expiryDate = this.generateExpiryDate();
    
    const [card] = await db
      .insert(virtualCards)
      .values({ 
        ...insertCard, 
        cardNumber, 
        cvv, 
        expiryDate,
        purchaseAmount: "60.00"
      })
      .returning();
    return card;
  }

  async getVirtualCardByUserId(userId: string): Promise<VirtualCard | undefined> {
    const [card] = await db.select().from(virtualCards).where(eq(virtualCards.userId, userId));
    return card || undefined;
  }

  async updateVirtualCard(id: string, updates: Partial<VirtualCard>): Promise<VirtualCard | undefined> {
    const [card] = await db
      .update(virtualCards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(virtualCards.id, id))
      .returning();
    return card || undefined;
  }

  // Transaction operations
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const reference = this.generateTransactionReference();
    const [transaction] = await db
      .insert(transactions)
      .values({ ...insertTransaction, reference })
      .returning();
    return transaction;
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const [transaction] = await db
      .update(transactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return transaction || undefined;
  }

  // Payment Request operations
  async createPaymentRequest(insertRequest: InsertPaymentRequest): Promise<PaymentRequest> {
    const [request] = await db
      .insert(paymentRequests)
      .values(insertRequest)
      .returning();
    return request;
  }

  async getPaymentRequestsByUserId(userId: string): Promise<PaymentRequest[]> {
    return await db
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.fromUserId, userId))
      .orderBy(desc(paymentRequests.createdAt));
  }

  async updatePaymentRequest(id: string, updates: Partial<PaymentRequest>): Promise<PaymentRequest | undefined> {
    const [request] = await db
      .update(paymentRequests)
      .set(updates)
      .where(eq(paymentRequests.id, id))
      .returning();
    return request || undefined;
  }

  async getPaymentRequest(id: string): Promise<PaymentRequest | undefined> {
    const [request] = await db
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.id, id));
    return request || undefined;
  }

  // Recipient operations
  async createRecipient(data: InsertRecipient): Promise<Recipient> {
    const [recipient] = await db
      .insert(recipients)
      .values(data)
      .returning();
    return recipient;
  }

  async getRecipientsByUserId(userId: string): Promise<Recipient[]> {
    return db
      .select()
      .from(recipients)
      .where(eq(recipients.userId, userId))
      .orderBy(desc(recipients.createdAt));
  }

  async getRecipient(id: string): Promise<Recipient | undefined> {
    const [recipient] = await db
      .select()
      .from(recipients)
      .where(eq(recipients.id, id));
    return recipient;
  }

  async updateRecipient(id: string, data: Partial<Recipient>): Promise<Recipient | undefined> {
    const [recipient] = await db
      .update(recipients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(recipients.id, id))
      .returning();
    return recipient;
  }

  async deleteRecipient(id: string): Promise<void> {
    await db.delete(recipients).where(eq(recipients.id, id));
  }

  private generateCardNumber(): string {
    return "4567" + Math.random().toString().slice(2, 14);
  }

  private generateCVV(): string {
    return Math.floor(Math.random() * 900 + 100).toString();
  }

  private generateExpiryDate(): string {
    const currentYear = new Date().getFullYear();
    const expiryYear = currentYear + 4;
    return `12/${expiryYear.toString().slice(-2)}`;
  }

  private generateTransactionReference(): string {
    return 'GP' + Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  // Admin operations
  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin || undefined;
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const hashedPassword = await bcrypt.hash(insertAdmin.password, 10);
    const [admin] = await db
      .insert(admins)
      .values({ ...insertAdmin, password: hashedPassword })
      .returning();
    return admin;
  }

  async updateAdmin(id: string, updates: Partial<Admin>): Promise<Admin | undefined> {
    const [admin] = await db
      .update(admins)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(admins.id, id))
      .returning();
    return admin || undefined;
  }

  async createAdminLog(insertLog: InsertAdminLog): Promise<AdminLog> {
    const [log] = await db
      .insert(adminLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getAdminLogs(): Promise<AdminLog[]> {
    return await db
      .select()
      .from(adminLogs)
      .orderBy(desc(adminLogs.createdAt));
  }

  // Admin data operations
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt));
  }

  async getAllKycDocuments(): Promise<KycDocument[]> {
    return await db
      .select()
      .from(kycDocuments)
      .orderBy(desc(kycDocuments.createdAt));
  }

  async getAllVirtualCards(): Promise<VirtualCard[]> {
    return await db
      .select()
      .from(virtualCards)
      .orderBy(desc(virtualCards.purchaseDate));
  }

  async getUsersCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(users);
    return result[0].count;
  }

  async getTransactionsCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(transactions);
    return result[0].count;
  }

  async getTotalVolume(): Promise<{ volume: number; revenue: number }> {
    const volumeResult = await db
      .select({ 
        totalVolume: sum(transactions.amount).mapWith(Number),
        totalFees: sum(transactions.fee).mapWith(Number)
      })
      .from(transactions)
      .where(eq(transactions.status, 'completed'));

    return {
      volume: volumeResult[0].totalVolume || 0,
      revenue: volumeResult[0].totalFees || 0
    };
  }

  // System settings
  async getSystemSetting(category: string, key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.category, category))
      .where(eq(systemSettings.key, key));
    return setting || undefined;
  }

  async setSystemSetting(insertSetting: InsertSystemSetting): Promise<SystemSetting> {
    const [setting] = await db
      .insert(systemSettings)
      .values(insertSetting)
      .returning();
    return setting;
  }

  async updateSystemSetting(id: string, updates: Partial<SystemSetting>): Promise<SystemSetting | undefined> {
    const [setting] = await db
      .update(systemSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(systemSettings.id, id))
      .returning();
    return setting || undefined;
  }

  async getSystemSettings(): Promise<SystemSetting[]> {
    return await db
      .select()
      .from(systemSettings)
      .orderBy(systemSettings.category, systemSettings.key);
  }

  async createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    return await this.setSystemSetting(setting);
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getGlobalNotifications(): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.isGlobal, true))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async deleteNotification(id: string): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.id, id));
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();

// Keep MemStorage for fallback if needed
export const memStorage = new MemStorage();

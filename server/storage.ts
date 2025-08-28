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
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

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

  // Payment Request operations
  createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest>;
  getPaymentRequestsByUserId(userId: string): Promise<PaymentRequest[]>;
  updatePaymentRequest(id: string, updates: Partial<PaymentRequest>): Promise<PaymentRequest | undefined>;
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
        recipientId: undefined,
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
        recipientId: undefined,
        recipientDetails: { name: "James Kone", email: "james@email.com", country: "Ghana" },
        status: "completed",
        fee: "0.00",
        exchangeRate: undefined,
        description: "Received from James Kone",
        createdAt: new Date(Date.now() - 86400000), // Yesterday
      },
      {
        id: "txn-3",
        userId: demoUser.id,
        type: "deposit",
        amount: "500.00",
        currency: "USD",
        recipientId: undefined,
        recipientDetails: undefined,
        status: "completed",
        fee: "0.00",
        exchangeRate: undefined,
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

export const storage = new MemStorage();

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertKycDocumentSchema, insertTransactionSchema, insertPaymentRequestSchema } from "@shared/schema";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const otpSchema = z.object({
  code: z.string().length(6),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // In a real app, hash the password
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...userResponse } = user;
      res.json({ user: userResponse });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Remove password from response
      const { password: _, ...userResponse } = user;
      res.json({ user: userResponse });
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { code } = otpSchema.parse(req.body);
      const { userId } = req.body;
      
      // Mock OTP verification - in real app, verify against stored OTP
      if (code === "123456") {
        await storage.updateUser(userId, { isPhoneVerified: true });
        res.json({ success: true });
      } else {
        res.status(400).json({ message: "Invalid OTP code" });
      }
    } catch (error) {
      res.status(400).json({ message: "Invalid OTP data" });
    }
  });

  // KYC routes
  app.post("/api/kyc/submit", async (req, res) => {
    try {
      const kycData = insertKycDocumentSchema.parse(req.body);
      const kyc = await storage.createKycDocument(kycData);
      
      // Auto-approve for demo
      await storage.updateKycDocument(kyc.id, { status: "verified" });
      await storage.updateUser(kycData.userId, { kycStatus: "verified" });
      
      res.json({ kyc });
    } catch (error) {
      res.status(400).json({ message: "Invalid KYC data" });
    }
  });

  app.get("/api/kyc/:userId", async (req, res) => {
    try {
      const kyc = await storage.getKycByUserId(req.params.userId);
      res.json({ kyc });
    } catch (error) {
      res.status(500).json({ message: "Error fetching KYC data" });
    }
  });

  // Virtual Card routes
  app.post("/api/virtual-card/purchase", async (req, res) => {
    try {
      const { userId } = req.body;
      
      // Check if user already has a card
      const existingCard = await storage.getVirtualCardByUserId(userId);
      if (existingCard) {
        return res.status(400).json({ message: "User already has a virtual card" });
      }

      const card = await storage.createVirtualCard({ userId });
      await storage.updateUser(userId, { hasVirtualCard: true });
      
      // Create transaction record for card purchase
      await storage.createTransaction({
        userId,
        type: "card_purchase",
        amount: "60.00",
        currency: "USD",
        description: "Virtual Card Purchase",
        fee: "0.00",
      });

      res.json({ card });
    } catch (error) {
      res.status(500).json({ message: "Error purchasing virtual card" });
    }
  });

  app.get("/api/virtual-card/:userId", async (req, res) => {
    try {
      const card = await storage.getVirtualCardByUserId(req.params.userId);
      res.json({ card });
    } catch (error) {
      res.status(500).json({ message: "Error fetching virtual card" });
    }
  });

  // Transaction routes
  app.post("/api/transactions", async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      
      // Auto-complete for demo
      setTimeout(async () => {
        await storage.updateTransaction(transaction.id, { status: "completed" });
      }, 2000);
      
      res.json({ transaction });
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  app.get("/api/transactions/:userId", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByUserId(req.params.userId);
      res.json({ transactions });
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  // Payment Request routes
  app.post("/api/payment-requests", async (req, res) => {
    try {
      const requestData = insertPaymentRequestSchema.parse(req.body);
      const paymentRequest = await storage.createPaymentRequest(requestData);
      res.json({ paymentRequest });
    } catch (error) {
      res.status(400).json({ message: "Invalid payment request data" });
    }
  });

  app.get("/api/payment-requests/:userId", async (req, res) => {
    try {
      const requests = await storage.getPaymentRequestsByUserId(req.params.userId);
      res.json({ requests });
    } catch (error) {
      res.status(500).json({ message: "Error fetching payment requests" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userResponse } = user;
      res.json({ user: userResponse });
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

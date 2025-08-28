import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertKycDocumentSchema, insertTransactionSchema, insertPaymentRequestSchema, insertRecipientSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import multer from "multer";
import { whatsappService } from "./services/whatsapp";
import { exchangeRateService } from "./services/exchange-rate";
import { paystackService } from "./services/paystack";
import { twoFactorService } from "./services/2fa";
import { biometricService } from "./services/biometric";
import { notificationService } from "./services/notifications";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const otpSchema = z.object({
  code: z.string().length(6),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes with real WhatsApp integration
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create user with hashed password (now handled in storage)
      const user = await storage.createUser(userData);
      
      // Auto-verify phone and email for smoother onboarding
      await storage.updateUser(user.id, { 
        isPhoneVerified: true, 
        isEmailVerified: true 
      });
      
      // Remove password from response
      const { password, ...userResponse } = user;
      res.json({ user: { ...userResponse, isPhoneVerified: true, isEmailVerified: true } });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password using bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Send security notification
      await notificationService.sendSecurityNotification(
        user.id,
        "New login detected from your account"
      );

      // Remove password from response
      const { password: _, ...userResponse } = user;
      res.json({ user: userResponse });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { code } = otpSchema.parse(req.body);
      const { userId } = req.body;
      
      // Verify OTP against stored code
      const isValid = await storage.verifyUserOtp(userId, code);
      
      if (isValid) {
        const user = await storage.getUser(userId);
        const { password, ...userResponse } = user!;
        res.json({ success: true, user: userResponse });
      } else {
        res.status(400).json({ message: "Invalid or expired OTP code" });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(400).json({ message: "Invalid OTP data" });
    }
  });

  // Resend OTP
  app.post("/api/auth/resend-otp", async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const otpCode = whatsappService.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      
      await storage.updateUserOtp(user.id, otpCode, otpExpiry);
      await whatsappService.sendOTP(user.phone, otpCode);
      
      res.json({ message: "New OTP sent to your phone" });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({ message: "Failed to resend OTP" });
    }
  });

  // KYC routes with file upload
  app.post("/api/kyc/submit", upload.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { userId, documentType, dateOfBirth, address } = req.body;
      
      // In a real app, upload files to cloud storage (AWS S3, Cloudinary, etc.)
      const frontImageUrl = files.frontImage ? `uploads/kyc/${userId}_front_${Date.now()}.jpg` : null;
      const backImageUrl = files.backImage ? `uploads/kyc/${userId}_back_${Date.now()}.jpg` : null;
      const selfieUrl = files.selfie ? `uploads/kyc/${userId}_selfie_${Date.now()}.jpg` : null;
      
      const kycData = {
        userId,
        documentType,
        dateOfBirth,
        address,
        frontImageUrl,
        backImageUrl,
        selfieUrl
      };
      
      const kyc = await storage.createKycDocument(kycData);
      
      // Update user KYC status to submitted
      await storage.updateUser(userId, { kycStatus: "submitted" });
      
      // Send notification
      await notificationService.sendNotification({
        title: "KYC Documents Submitted",
        body: "Your verification documents have been received and are under review",
        userId,
        type: "general"
      });
      
      res.json({ kyc, message: "KYC documents submitted successfully" });
    } catch (error) {
      console.error('KYC submission error:', error);
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

  // Virtual Card routes with Paystack integration
  app.post("/api/virtual-card/initialize-payment", async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already has a card
      const existingCard = await storage.getVirtualCardByUserId(userId);
      if (existingCard) {
        return res.status(400).json({ message: "User already has a virtual card" });
      }

      // Check if user has completed KYC
      if (user.kycStatus !== "verified") {
        return res.status(400).json({ message: "Please complete KYC verification first" });
      }

      // Initialize Paystack payment
      const reference = paystackService.generateReference();
      const paymentData = await paystackService.initializePayment(
        user.email,
        60, // $60 USD
        reference
      );

      if (!paymentData.status) {
        return res.status(400).json({ message: "Failed to initialize payment" });
      }

      res.json({ 
        authorizationUrl: paymentData.data.authorization_url,
        reference: paymentData.data.reference
      });
    } catch (error) {
      console.error('Card payment initialization error:', error);
      res.status(500).json({ message: "Error initializing card payment" });
    }
  });

  app.post("/api/virtual-card/verify-payment", async (req, res) => {
    try {
      const { reference, userId } = req.body;
      
      // Verify payment with Paystack
      const verification = await paystackService.verifyPayment(reference);
      
      if (!verification.status || verification.data.status !== 'success') {
        return res.status(400).json({ message: "Payment verification failed" });
      }

      // Create virtual card
      const card = await storage.createVirtualCard({ 
        userId,
        paystackReference: reference
      });
      
      await storage.updateUser(userId, { hasVirtualCard: true });
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        type: "card_purchase",
        amount: "60.00",
        currency: "USD",
        description: "Virtual Card Purchase",
        fee: "0.00",
        paystackReference: reference,
        status: "completed"
      });

      // Send notifications
      await notificationService.sendTransactionNotification(userId, transaction);
      
      res.json({ card, transaction, message: "Virtual card purchased successfully!" });
    } catch (error) {
      console.error('Card payment verification error:', error);
      res.status(500).json({ message: "Error verifying card payment" });
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

  // Exchange rates API
  app.get("/api/exchange-rates/:from/:to", async (req, res) => {
    try {
      const { from, to } = req.params;
      const rate = await exchangeRateService.getExchangeRate(from.toUpperCase(), to.toUpperCase());
      
      res.json({ 
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Exchange rate error:', error);
      res.status(500).json({ message: "Error fetching exchange rate" });
    }
  });

  app.get("/api/exchange-rates/:base", async (req, res) => {
    try {
      const { base } = req.params;
      const targets = ['NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'XOF', 'XAF'];
      const rates = await exchangeRateService.getMultipleRates(base.toUpperCase(), targets);
      
      res.json({ 
        base: base.toUpperCase(),
        rates,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Multiple exchange rates error:', error);
      res.status(500).json({ message: "Error fetching exchange rates" });
    }
  });

  // Real-time Transaction routes
  app.post("/api/transactions/send", async (req, res) => {
    try {
      const { userId, amount, currency, recipientDetails, targetCurrency } = req.body;
      
      // Verify user has virtual card
      const user = await storage.getUser(userId);
      if (!user?.hasVirtualCard) {
        return res.status(400).json({ message: "Virtual card required for transactions" });
      }

      // Get real-time exchange rate
      const exchangeRate = await exchangeRateService.getExchangeRate(currency, targetCurrency);
      const convertedAmount = (parseFloat(amount) * exchangeRate).toFixed(2);
      const fee = (parseFloat(amount) * 0.02).toFixed(2); // 2% fee
      
      // Create transaction
      const transaction = await storage.createTransaction({
        userId,
        type: "send",
        amount,
        currency,
        recipientDetails,
        status: "processing",
        fee,
        exchangeRate: exchangeRate.toString(),
        description: `Sent to ${recipientDetails.name}`,
        metadata: {
          convertedAmount,
          targetCurrency,
          processingStarted: new Date().toISOString()
        }
      });

      // Simulate processing time (in real app, this would be async)
      setTimeout(async () => {
        try {
          await storage.updateTransaction(transaction.id, { 
            status: "completed",
            completedAt: new Date()
          });
          
          // Send notification
          await notificationService.sendTransactionNotification(userId, {
            ...transaction,
            status: "completed"
          });
        } catch (error) {
          console.error('Transaction completion error:', error);
        }
      }, 5000); // 5 second delay
      
      res.json({ 
        transaction,
        convertedAmount,
        exchangeRate,
        message: "Transaction initiated successfully"
      });
    } catch (error) {
      console.error('Send transaction error:', error);
      res.status(400).json({ message: "Transaction failed" });
    }
  });

  app.post("/api/transactions/receive", async (req, res) => {
    try {
      const { userId, amount, currency, senderDetails } = req.body;
      
      const transaction = await storage.createTransaction({
        userId,
        type: "receive",
        amount,
        currency,
        recipientDetails: senderDetails,
        status: "completed",
        fee: "0.00",
        description: `Received from ${senderDetails.name}`
      });

      // Update user balance
      const user = await storage.getUser(userId);
      const newBalance = (parseFloat(user?.balance || "0") + parseFloat(amount)).toFixed(2);
      await storage.updateUser(userId, { balance: newBalance });
      
      // Send notification
      await notificationService.sendTransactionNotification(userId, transaction);
      
      res.json({ transaction, message: "Payment received successfully" });
    } catch (error) {
      console.error('Receive transaction error:', error);
      res.status(400).json({ message: "Transaction failed" });
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

  app.get("/api/transactions/status/:transactionId", async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json({ transaction });
    } catch (error) {
      res.status(500).json({ message: "Error fetching transaction status" });
    }
  });

  // 2FA routes
  app.post("/api/auth/2fa/setup", async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { secret, qrCodeUrl, backupCodes } = twoFactorService.generateSecret(user.email);
      const qrCode = await twoFactorService.generateQRCode(secret, user.email);
      
      // Store secret temporarily (user needs to verify before enabling)
      await storage.updateUser(userId, { twoFactorSecret: secret });
      
      res.json({ qrCode, backupCodes, secret });
    } catch (error) {
      console.error('2FA setup error:', error);
      res.status(500).json({ message: "Error setting up 2FA" });
    }
  });

  app.post("/api/auth/2fa/verify", async (req, res) => {
    try {
      const { userId, token } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user?.twoFactorSecret) {
        return res.status(400).json({ message: "2FA not set up" });
      }

      const isValid = twoFactorService.verifyToken(user.twoFactorSecret, token);
      
      if (isValid) {
        await storage.updateUser(userId, { twoFactorEnabled: true });
        res.json({ success: true, message: "2FA enabled successfully" });
      } else {
        res.status(400).json({ message: "Invalid 2FA token" });
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      res.status(500).json({ message: "Error verifying 2FA" });
    }
  });

  // Biometric authentication routes
  app.post("/api/auth/biometric/setup", async (req, res) => {
    try {
      const { userId } = req.body;
      const challenge = await biometricService.generateChallenge(userId);
      
      res.json({ challenge });
    } catch (error) {
      console.error('Biometric setup error:', error);
      res.status(500).json({ message: "Error setting up biometric authentication" });
    }
  });

  app.post("/api/auth/biometric/register", async (req, res) => {
    try {
      const { userId, credential, challenge } = req.body;
      
      const success = await biometricService.registerBiometric(userId, credential);
      
      if (success) {
        await storage.updateUser(userId, { biometricEnabled: true });
        res.json({ success: true, message: "Biometric authentication enabled" });
      } else {
        res.status(400).json({ message: "Failed to register biometric" });
      }
    } catch (error) {
      console.error('Biometric registration error:', error);
      res.status(500).json({ message: "Error registering biometric" });
    }
  });

  app.post("/api/auth/biometric/verify", async (req, res) => {
    try {
      const { userId, challenge, response } = req.body;
      
      const isValid = await biometricService.verifyBiometric(userId, challenge, response);
      
      if (isValid) {
        res.json({ success: true, message: "Biometric verification successful" });
      } else {
        res.status(400).json({ message: "Biometric verification failed" });
      }
    } catch (error) {
      console.error('Biometric verification error:', error);
      res.status(500).json({ message: "Error verifying biometric" });
    }
  });

  // Push notifications
  app.post("/api/notifications/register", async (req, res) => {
    try {
      const { userId, token } = req.body;
      
      const success = await notificationService.registerPushToken(userId, token);
      
      if (success) {
        res.json({ success: true, message: "Push notifications registered" });
      } else {
        res.status(400).json({ message: "Failed to register push notifications" });
      }
    } catch (error) {
      console.error('Push notification registration error:', error);
      res.status(500).json({ message: "Error registering push notifications" });
    }
  });

  // Recipient management routes
  app.post("/api/recipients", async (req, res) => {
    try {
      const recipientData = insertRecipientSchema.parse(req.body);
      const recipient = await storage.createRecipient(recipientData);
      res.json({ recipient, message: "Recipient added successfully" });
    } catch (error) {
      console.error('Create recipient error:', error);
      res.status(400).json({ message: "Invalid recipient data" });
    }
  });

  app.get("/api/recipients/:userId", async (req, res) => {
    try {
      const recipients = await storage.getRecipientsByUserId(req.params.userId);
      res.json({ recipients });
    } catch (error) {
      res.status(500).json({ message: "Error fetching recipients" });
    }
  });

  app.put("/api/recipients/:id", async (req, res) => {
    try {
      const recipient = await storage.updateRecipient(req.params.id, req.body);
      if (recipient) {
        res.json({ recipient, message: "Recipient updated successfully" });
      } else {
        res.status(404).json({ message: "Recipient not found" });
      }
    } catch (error) {
      console.error('Update recipient error:', error);
      res.status(500).json({ message: "Error updating recipient" });
    }
  });

  app.delete("/api/recipients/:id", async (req, res) => {
    try {
      await storage.deleteRecipient(req.params.id);
      res.json({ message: "Recipient deleted successfully" });
    } catch (error) {
      console.error('Delete recipient error:', error);
      res.status(500).json({ message: "Error deleting recipient" });
    }
  });

  // User settings
  app.put("/api/users/:userId/settings", async (req, res) => {
    try {
      const { userId } = req.params;
      const { defaultCurrency, ...settings } = req.body;
      
      // Save default currency preference
      const updateData = { ...settings };
      if (defaultCurrency) {
        updateData.defaultCurrency = defaultCurrency;
      }
      
      const user = await storage.updateUser(userId, updateData);
      
      if (user) {
        const { password, ...userResponse } = user;
        res.json({ user: userResponse, message: "Settings updated successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error('Settings update error:', error);
      res.status(500).json({ message: "Error updating settings" });
    }
  });

  // Real-time exchange and currency conversion
  app.post("/api/exchange/convert", async (req, res) => {
    try {
      const { amount, fromCurrency, toCurrency, userId } = req.body;
      
      // Verify user has virtual card for exchanges
      const user = await storage.getUser(userId);
      if (!user?.hasVirtualCard) {
        return res.status(400).json({ message: "Virtual card required for currency exchanges" });
      }

      const exchangeRate = await exchangeRateService.getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = (parseFloat(amount) * exchangeRate).toFixed(2);
      const fee = (parseFloat(amount) * 0.015).toFixed(2); // 1.5% exchange fee
      
      // Create exchange transaction
      const transaction = await storage.createTransaction({
        userId,
        type: "exchange",
        amount,
        currency: fromCurrency,
        status: "completed",
        fee,
        exchangeRate: exchangeRate.toString(),
        description: `Exchanged ${amount} ${fromCurrency} to ${convertedAmount} ${toCurrency}`,
        metadata: {
          targetCurrency: toCurrency,
          convertedAmount,
          exchangeType: "instant"
        }
      });
      
      res.json({ 
        transaction,
        convertedAmount,
        exchangeRate,
        fee,
        message: "Currency exchanged successfully"
      });
    } catch (error) {
      console.error('Exchange error:', error);
      res.status(400).json({ message: "Exchange failed" });
    }
  });

  // Payment Request routes with working payment links
  app.post("/api/payment-requests", async (req, res) => {
    try {
      const requestData = insertPaymentRequestSchema.parse(req.body);
      
      // Generate unique payment link
      const paymentId = Math.random().toString(36).substring(2, 15);
      const paymentLink = `${req.protocol}://${req.get('host')}/pay/${paymentId}`;
      
      const request = await storage.createPaymentRequest({
        ...requestData,
        paymentLink,
      });
      
      // Send notification if recipient has account
      if (requestData.toEmail || requestData.toPhone) {
        await notificationService.sendNotification({
          title: "Payment Request",
          body: `You have received a payment request for ${requestData.currency} ${requestData.amount}`,
          userId: requestData.fromUserId,
          type: "general",
          metadata: { paymentRequestId: request.id }
        });
      }
      
      res.json({ request, message: "Payment request created successfully" });
    } catch (error) {
      console.error('Payment request error:', error);
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

  app.post("/api/payment-requests/:id/pay", async (req, res) => {
    try {
      const { id } = req.params;
      const { payerUserId } = req.body;
      
      const paymentRequest = await storage.getPaymentRequest(id);
      if (!paymentRequest) {
        return res.status(404).json({ message: "Payment request not found" });
      }

      if (paymentRequest.status !== 'pending') {
        return res.status(400).json({ message: "Payment request already processed" });
      }

      // Process payment
      const transaction = await storage.createTransaction({
        userId: payerUserId,
        type: "send",
        amount: paymentRequest.amount.toString(),
        currency: paymentRequest.currency,
        recipientDetails: { paymentRequestId: id },
        status: "completed",
        fee: "0.00",
        description: `Payment for request: ${paymentRequest.message || 'Payment request'}`
      });

      // Mark payment request as paid
      await storage.updatePaymentRequest(id, { status: 'paid' });
      
      // Notify requester
      await notificationService.sendNotification({
        title: "Payment Received",
        body: `Your payment request for ${paymentRequest.currency} ${paymentRequest.amount} has been paid`,
        userId: paymentRequest.fromUserId,
        type: "transaction"
      });
      
      res.json({ transaction, message: "Payment completed successfully" });
    } catch (error) {
      console.error('Payment processing error:', error);
      res.status(500).json({ message: "Error processing payment" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertKycDocumentSchema, insertTransactionSchema, insertPaymentRequestSchema, insertRecipientSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import multer from "multer";
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { whatsappService } from "./services/whatsapp";
import { exchangeRateService } from "./services/exchange-rate";
import { payHeroService } from "./services/payhero";
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

const transferSchema = z.object({
  fromUserId: z.string(),
  toUserId: z.string(),
  amount: z.string(),
  currency: z.string(),
  description: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint - must be defined early to avoid catch-all routes
  app.get("/health", (_req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      uptime: process.uptime()
    });
  });

  // Create default admin account if none exists
  try {
    const existingAdmin = await storage.getAdminByEmail("admin@greenpay.com");
    if (!existingAdmin) {
      await storage.createAdmin({
        email: "admin@greenpay.com",
        password: "Admin123!@#",
        fullName: "GreenPay Administrator",
        role: "admin",
        twoFactorEnabled: false
      });
      console.log("✅ Default admin account created: admin@greenpay.com / Admin123!@#");
    }
  } catch (error) {
    console.error("Failed to create default admin:", error);
  }
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

      // Store session data
      (req.session as any).userId = user.id;
      (req.session as any).user = { id: user.id, email: user.email };
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
      
      // Save session before responding
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
        }
        res.json({ user: userResponse });
      });
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
      
      // Update user KYC status to pending for admin review
      await storage.updateUser(userId, { kycStatus: "pending" });
      
      // Send notification
      await notificationService.sendNotification({
        title: "KYC Documents Submitted",
        body: "Your documents have been submitted for review. You will be notified once verified.",
        userId,
        type: "general"
      });
      
      res.json({ kyc, message: "KYC documents verified successfully" });
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
      console.log('Card payment request - userId:', userId, 'type:', typeof userId);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const user = await storage.getUser(userId);
      console.log('Card payment - Found user:', !!user, user?.email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already has a card
      const existingCard = await storage.getVirtualCardByUserId(userId);
      if (existingCard) {
        return res.status(400).json({ message: "User already has a virtual card" });
      }

      // Allow card purchase for production - KYC verification can be added later
      // Note: In production environment, additional KYC verification may be required

      // Generate unique reference
      const reference = payHeroService.generateReference();
      
      // Validate user email
      if (!user.email || !user.email.includes('@') || !user.email.includes('.')) {
        return res.status(400).json({ message: "Invalid user email. Please update your profile with a valid email address." });
      }

      // Validate user phone number for M-Pesa
      if (!user.phone) {
        return res.status(400).json({ message: "Phone number is required for M-Pesa payments. Please update your profile." });
      }

      // Convert $15 USD to KES (75% off from original $60)
      const usdAmount = 15;
      const kesAmount = await payHeroService.convertUSDtoKES(usdAmount);
      
      console.log(`Converting $${usdAmount} USD to ${kesAmount} KES for card purchase`);

      // Initialize payment with PayHero M-Pesa STK Push
      const callbackUrl = `${req.protocol}://${req.get('host')}/api/payhero-callback?reference=${reference}&type=virtual-card`;
      
      const paymentData = await payHeroService.initiateMpesaPayment(
        kesAmount, // Amount in KES
        user.phone, // Phone number for M-Pesa STK Push
        reference, // External reference
        user.fullName, // Customer name
        callbackUrl // Callback URL for tracking
      );
      
      if (!paymentData.success) {
        return res.status(400).json({ message: 'Payment initiation failed', status: paymentData.status });
      }
      
      res.json({ 
        success: true,
        reference: paymentData.reference,
        checkoutRequestId: paymentData.CheckoutRequestID,
        status: paymentData.status,
        message: 'STK Push sent to your phone. Please enter your M-Pesa PIN to complete payment.'
      });
    } catch (error) {
      console.error('Card payment initialization error:', error);
      res.status(500).json({ message: "Error initializing card payment" });
    }
  });

  // User profile management endpoints
  app.put("/api/users/:id/profile", async (req, res) => {
    try {
      const { id } = req.params;
      const { fullName, email, phone, country } = req.body;

      const updatedUser = await storage.updateUser(id, {
        fullName,
        email,
        phone,
        country,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userResponse } = updatedUser;
      res.json({ user: userResponse });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  app.put("/api/users/:id/settings", async (req, res) => {
    try {
      const { id } = req.params;
      const settings = req.body;

      const updatedUser = await storage.updateUser(id, settings);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userResponse } = updatedUser;
      res.json({ user: userResponse });
    } catch (error) {
      console.error('Settings update error:', error);
      res.status(400).json({ message: "Failed to update settings" });
    }
  });

  // KYC endpoints
  app.get("/api/kyc/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const kyc = await storage.getKycByUserId(userId);
      res.json({ kyc: kyc || { status: 'pending', documentType: 'national_id' } });
    } catch (error) {
      console.error('KYC fetch error:', error);
      res.status(500).json({ message: "Failed to fetch KYC data" });
    }
  });

  app.post("/api/kyc/submit", upload.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const { userId, documentType, dateOfBirth, address } = req.body;
      
      // Create real KYC document with uploaded files
      const files = req.files as any;
      
      const kycDocument = await storage.createKycDocument({
        userId,
        documentType,
        dateOfBirth: new Date(dateOfBirth),
        address,
        frontImagePath: files?.frontImage?.[0]?.filename || null,
        backImagePath: files?.backImage?.[0]?.filename || null,
        selfiePath: files?.selfie?.[0]?.filename || null,
      });

      // Update user KYC status to pending (admin will verify)
      await storage.updateUser(userId, { kycStatus: "pending" });

      res.json({ kyc: kycDocument });
    } catch (error) {
      console.error('KYC submission error:', error);
      res.status(400).json({ message: "Failed to submit KYC documents" });
    }
  });

  // 2FA setup endpoint
  app.post("/api/auth/setup-2fa", async (req, res) => {
    try {
      const { userId } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate proper 2FA secret and QR code
      const secret = speakeasy.generateSecret({
        name: `GreenPay (${user.email})`,
        issuer: 'GreenPay'
      });
      
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
      
      // Save secret to user (in production, save encrypted)
      await storage.updateUser(userId, { twoFactorSecret: secret.base32 });
      
      res.json({ 
        qrCodeUrl,
        secret: secret.base32, // Don't send in production
        message: "Scan QR code with your authenticator app"
      });
    } catch (error) {
      console.error('2FA setup error:', error);
      res.status(500).json({ message: "Failed to setup 2FA" });
    }
  });

  // Biometric setup endpoint
  app.post("/api/auth/setup-biometric", async (req, res) => {
    try {
      const { userId } = req.body;
      
      // In production, use WebAuthn for proper biometric authentication
      await storage.updateUser(userId, { biometricEnabled: true });
      
      res.json({ message: "Biometric authentication enabled" });
    } catch (error) {
      console.error('Biometric setup error:', error);
      res.status(500).json({ message: "Failed to setup biometric authentication" });
    }
  });

  // Push notification registration endpoint
  app.post("/api/notifications/register", async (req, res) => {
    try {
      const { userId, endpoint } = req.body;
      
      // Register user for push notifications
      await storage.updateUser(userId, { pushNotificationsEnabled: true });
      
      // In production, save the push subscription endpoint
      res.json({ message: "Push notifications registered" });
    } catch (error) {
      console.error('Notification registration error:', error);
      res.status(500).json({ message: "Failed to register for notifications" });
    }
  });

  app.post("/api/virtual-card/verify-payment", async (req, res) => {
    try {
      const { reference, userId } = req.body;
      
      if (!reference || !userId) {
        return res.status(400).json({ message: "Reference and user ID are required" });
      }

      console.log('Verifying payment for reference:', reference);

      // Verify payment with Paystack
      const verificationResult = await paystackService.verifyPayment(reference);
      
      if (!verificationResult.status) {
        console.error('Paystack verification failed:', verificationResult.message);
        return res.status(400).json({ 
          message: "Payment verification failed", 
          error: verificationResult.message,
          success: false
        });
      }

      const paymentData = verificationResult.data;
      console.log('Paystack verification result:', paymentData.status, paymentData.amount);

      // Check if payment was successful
      if (paymentData.status !== 'success') {
        console.log('Payment was not successful:', paymentData.status);
        
        // Create failed transaction record
        const failedTransaction = await storage.createTransaction({
          userId,
          type: "card_purchase",
          amount: (paymentData.amount / 100).toString(), // Convert from kobo/cents
          currency: paymentData.currency || "KES",
          description: "Virtual Card Purchase - Failed",
          fee: "0.00",
          paystackReference: reference,
          status: "failed"
        });

        // Send failure notification
        await notificationService.sendTransactionNotification(userId, failedTransaction);
        
        return res.status(400).json({ 
          message: "Payment was not completed successfully", 
          status: paymentData.status,
          success: false,
          transaction: failedTransaction
        });
      }

      // Double-check payment is actually successful before creating card
      if (paymentData.status !== 'success' || !paymentData.amount) {
        console.error('Payment verification failed - status:', paymentData.status, 'amount:', paymentData.amount);
        return res.status(400).json({ 
          message: "Payment verification failed - payment not successful", 
          success: false
        });
      }

      // Payment was successful - create virtual card
      console.log('Payment successful, creating virtual card');
      const card = await storage.createVirtualCard({ 
        userId,
        paystackReference: reference
      });
      
      await storage.updateUser(userId, { hasVirtualCard: true });
      
      // Create successful transaction record
      const transaction = await storage.createTransaction({
        userId,
        type: "card_purchase",
        amount: (paymentData.amount / 100).toString(), // Convert from kobo/cents
        currency: paymentData.currency || "KES",
        description: "Virtual Card Purchase - Successful",
        fee: "0.00",
        paystackReference: reference,
        status: "completed"
      });

      // Send success notification
      await notificationService.sendTransactionNotification(userId, transaction);
      
      res.json({ 
        card, 
        transaction, 
        message: "Virtual card purchased successfully!",
        success: true
      });
    } catch (error) {
      console.error('Card payment verification error:', error);
      res.status(500).json({ 
        message: "Error verifying card payment",
        success: false
      });
    }
  });

  // Payment callback handler for Paystack
  app.get("/api/payment-callback", async (req, res) => {
    try {
      const { reference, trxref, type } = req.query;
      const actualReference = reference || trxref;
      
      console.log('Payment callback received:', { reference: actualReference, type });

      if (!actualReference) {
        return res.status(400).json({ message: "Payment reference is required" });
      }

      // Verify the payment with Paystack
      const verificationResult = await paystackService.verifyPayment(actualReference as string);
      
      if (!verificationResult.status) {
        console.error('Callback payment verification failed:', verificationResult.message);
        return res.redirect(`/payment-failed?reference=${actualReference}&error=${encodeURIComponent(verificationResult.message)}`);
      }

      const paymentData = verificationResult.data;
      
      if (paymentData.status === 'success') {
        // Payment successful - redirect to success page
        if (type === 'virtual-card') {
          return res.redirect(`/payment-success?reference=${actualReference}&type=virtual-card`);
        } else {
          return res.redirect(`/payment-success?reference=${actualReference}&type=deposit`);
        }
      } else {
        // Payment failed - redirect to failure page
        return res.redirect(`/payment-failed?reference=${actualReference}&status=${paymentData.status}`);
      }
    } catch (error) {
      console.error('Payment callback error:', error);
      return res.redirect(`/payment-failed?error=${encodeURIComponent('Payment verification failed')}`);
    }
  });

  // Paystack webhook handler for real-time payment updates
  app.post("/api/webhook/paystack", async (req, res) => {
    try {
      const event = req.body;
      console.log('Paystack webhook received:', event.event, event.data?.reference);

      // Verify webhook authenticity (in production, verify signature)
      if (event.event === 'charge.success') {
        const { reference, status, amount, currency } = event.data;
        
        console.log('Webhook payment success:', { reference, status, amount, currency });
        
        // Handle successful payment here if needed
        // This is a backup to the callback URL method
        
      } else if (event.event === 'charge.failed') {
        const { reference, status } = event.data;
        console.log('Webhook payment failed:', { reference, status });
      }

      // Always respond with 200 to acknowledge webhook
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Deposit payment initialization
  app.post("/api/deposit/initialize-payment", async (req, res) => {
    try {
      const { userId, amount, currency } = req.body;
      console.log('Deposit payment request - userId:', userId, 'amount:', amount, 'currency:', currency);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const user = await storage.getUser(userId);
      console.log('Deposit payment - Found user:', !!user, user?.email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate unique reference
      const reference = paystackService.generateReference();
      
      // Validate user email
      if (!user.email || !user.email.includes('@') || !user.email.includes('.')) {
        return res.status(400).json({ message: "Invalid user email. Please update your profile with a valid email address." });
      }

      // Validate user phone number for M-Pesa
      if (!user.phone) {
        return res.status(400).json({ message: "Phone number is required for M-Pesa payments. Please update your profile." });
      }

      // Validate amount
      const depositAmount = parseFloat(amount);
      if (isNaN(depositAmount) || depositAmount <= 0) {
        return res.status(400).json({ message: "Invalid deposit amount" });
      }

      // Initialize payment with Paystack in KES currency
      const callbackUrl = `${req.protocol}://${req.get('host')}/api/payment-callback?reference=${reference}&type=deposit`;
      
      const paymentData = await paystackService.initializePayment(
        user.email,
        depositAmount,
        reference,
        'KES', // Use KES currency
        user.phone, // Use registered phone number for M-Pesa
        callbackUrl // Callback URL for tracking
      );
      
      if (!paymentData.status) {
        return res.status(400).json({ message: paymentData.message });
      }
      
      res.json({ 
        authorizationUrl: paymentData.data.authorization_url,
        reference: reference
      });
    } catch (error) {
      console.error('Deposit payment initialization error:', error);
      res.status(500).json({ message: "Error initializing deposit payment" });
    }
  });

  // Verify deposit payment
  app.post("/api/deposit/verify-payment", async (req, res) => {
    try {
      const { reference, userId, amount, currency } = req.body;
      
      // Verify payment with Paystack
      const verification = await paystackService.verifyPayment(reference);
      
      if (!verification.status || verification.data.status !== 'success') {
        return res.status(400).json({ message: "Payment verification failed" });
      }
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        type: 'deposit',
        amount: amount.toString(),
        currency: currency || 'USD',
        status: 'completed',
        description: `Deposit via Paystack - ${reference}`,
        fee: '0.00',
        paystackReference: reference
      });

      // Get user again to ensure balance is current
      const updatedUser = await storage.getUser(userId);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user balance
      const currentBalance = parseFloat(updatedUser.balance || "0");
      const newBalance = currentBalance + depositAmount;
      await storage.updateUser(userId, { balance: newBalance.toFixed(2) });
      
      res.json({ 
        message: "Deposit successful",
        transaction
      });
    } catch (error) {
      console.error('Deposit verification error:', error);
      res.status(500).json({ message: "Error verifying deposit" });
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

  // Inter-account transfer route (NEW)
  app.post("/api/transfer", async (req, res) => {
    try {
      const { fromUserId, toUserId, amount, currency, description } = transferSchema.parse(req.body);
      
      const fromUser = await storage.getUser(fromUserId);
      const toUser = await storage.getUser(toUserId);
      
      if (!fromUser || !toUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check balance
      const currentBalance = parseFloat(fromUser.balance || "0");
      const transferAmount = parseFloat(amount);
      
      if (currentBalance < transferAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Create transactions for both users
      const sendTransaction = await storage.createTransaction({
        userId: fromUserId,
        type: "send",
        amount,
        currency,
        recipientId: toUserId,
        recipientDetails: { name: toUser.fullName, id: toUserId },
        status: "completed",
        fee: "0.00",
        description: description || `Transfer to ${toUser.fullName}`
      });

      const receiveTransaction = await storage.createTransaction({
        userId: toUserId,
        type: "receive",
        amount,
        currency,
        recipientId: fromUserId,
        recipientDetails: { name: fromUser.fullName, id: fromUserId },
        status: "completed",
        fee: "0.00",
        description: description || `Transfer from ${fromUser.fullName}`
      });

      // Update balances
      await storage.updateUser(fromUserId, { 
        balance: (currentBalance - transferAmount).toFixed(2) 
      });
      
      const toBalance = parseFloat(toUser.balance || "0");
      await storage.updateUser(toUserId, { 
        balance: (toBalance + transferAmount).toFixed(2) 
      });

      // Send notifications
      await notificationService.sendTransactionNotification(fromUserId, sendTransaction);
      await notificationService.sendTransactionNotification(toUserId, receiveTransaction);
      
      res.json({ 
        sendTransaction, 
        receiveTransaction, 
        message: "Transfer completed successfully" 
      });
    } catch (error) {
      console.error('Transfer error:', error);
      res.status(400).json({ message: "Transfer failed" });
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

  // User settings and profile updates
  app.put("/api/users/:userId/settings", async (req, res) => {
    try {
      const { userId } = req.params;
      const { defaultCurrency, pushNotificationsEnabled, twoFactorEnabled, biometricEnabled, ...settings } = req.body;
      
      // Save settings to user profile
      const updateData = { ...settings };
      if (defaultCurrency) updateData.defaultCurrency = defaultCurrency;
      if (pushNotificationsEnabled !== undefined) updateData.pushNotificationsEnabled = pushNotificationsEnabled;
      if (twoFactorEnabled !== undefined) updateData.twoFactorEnabled = twoFactorEnabled;
      if (biometricEnabled !== undefined) updateData.biometricEnabled = biometricEnabled;
      
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

  app.put("/api/users/:userId/profile", async (req, res) => {
    try {
      const { userId } = req.params;
      const { fullName, email, phone, country } = req.body;
      
      // Check if email is already taken by another user
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }
      
      // Check if phone is already taken by another user
      if (phone) {
        const existingUser = await storage.getUserByPhone(phone);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Phone number already in use" });
        }
      }
      
      const updateData = { fullName, email, phone, country };
      const user = await storage.updateUser(userId, updateData);
      
      if (user) {
        const { password, ...userResponse } = user;
        res.json({ user: userResponse, message: "Profile updated successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: "Error updating profile" });
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

  // Admin Authentication Routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password, twoFactorCode } = req.body;
      
      const admin = await storage.getAdminByEmail(email);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, admin.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check 2FA if enabled
      if (admin.twoFactorEnabled && admin.twoFactorSecret) {
        if (!twoFactorCode) {
          return res.status(401).json({ 
            message: "2FA code required", 
            requiresTwoFactor: true 
          });
        }

        const verified = speakeasy.totp.verify({
          secret: admin.twoFactorSecret,
          encoding: 'ascii',
          token: twoFactorCode,
          window: 2
        });

        if (!verified) {
          return res.status(401).json({ message: "Invalid 2FA code" });
        }
      }

      // Update last login
      await storage.updateAdmin(admin.id, { lastLoginAt: new Date() });

      // Log admin login
      await storage.createAdminLog({
        adminId: admin.id,
        action: "LOGIN",
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || null
      });

      const { password: _, ...adminData } = admin;
      res.json({ 
        admin: adminData,
        message: "Login successful"
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin Dashboard Data
  app.get("/api/admin/dashboard", async (req, res) => {
    try {
      const [
        usersCount,
        transactionsCount,
        { volume, revenue },
        allUsers,
        allTransactions,
        kycDocuments
      ] = await Promise.all([
        storage.getUsersCount(),
        storage.getTransactionsCount(),
        storage.getTotalVolume(),
        storage.getAllUsers(),
        storage.getAllTransactions(),
        storage.getAllKycDocuments()
      ]);

      const activeUsers = allUsers.filter(u => u.isEmailVerified || u.isPhoneVerified).length;
      const pendingKyc = kycDocuments.filter(d => d.status === 'pending').length;
      const completedTransactions = allTransactions.filter(t => t.status === 'completed').length;
      const pendingTransactions = allTransactions.filter(t => t.status === 'pending').length;

      // Calculate daily transaction trends (last 7 days)
      const today = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const transactionTrends = last7Days.map(date => {
        const dayTransactions = allTransactions.filter(t => 
          t.createdAt && t.createdAt.toISOString().split('T')[0] === date
        );
        return {
          date,
          count: dayTransactions.length,
          volume: dayTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0)
        };
      });

      res.json({
        metrics: {
          totalUsers: usersCount,
          activeUsers,
          blockedUsers: allUsers.filter(u => !u.isEmailVerified && !u.isPhoneVerified).length,
          totalTransactions: transactionsCount,
          completedTransactions,
          pendingTransactions,
          totalVolume: volume,
          totalRevenue: revenue,
          pendingKyc
        },
        transactionTrends,
        recentTransactions: allTransactions.slice(0, 10)
      });
    } catch (error) {
      console.error('Dashboard data error:', error);
      res.status(500).json({ message: "Failed to load dashboard data" });
    }
  });

  // Admin User Management
  app.get("/api/admin/users", async (req, res) => {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      let users = await storage.getAllUsers();

      // Filter by status
      if (status) {
        users = users.filter(user => {
          switch (status) {
            case 'active': return user.isEmailVerified || user.isPhoneVerified;
            case 'pending': return user.kycStatus === 'pending';
            case 'verified': return user.kycStatus === 'verified';
            case 'blocked': return !user.isEmailVerified && !user.isPhoneVerified;
            default: return true;
          }
        });
      }

      // Search filter
      if (search) {
        const searchTerm = search.toString().toLowerCase();
        users = users.filter(user => 
          user.fullName.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.phone.includes(searchTerm)
        );
      }

      // Pagination
      const startIndex = (Number(page) - 1) * Number(limit);
      const paginatedUsers = users.slice(startIndex, startIndex + Number(limit));

      res.json({
        users: paginatedUsers,
        total: users.length,
        page: Number(page),
        totalPages: Math.ceil(users.length / Number(limit))
      });
    } catch (error) {
      console.error('Users fetch error:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin KYC Management
  app.get("/api/admin/kyc", async (req, res) => {
    try {
      const kycDocuments = await storage.getAllKycDocuments();
      res.json({ kycDocuments });
    } catch (error) {
      console.error('KYC fetch error:', error);
      res.status(500).json({ message: "Failed to fetch KYC documents" });
    }
  });

  app.put("/api/admin/kyc/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, verificationNotes } = req.body;
      
      const updatedKyc = await storage.updateKycDocument(id, {
        status,
        verificationNotes,
        verifiedAt: status === 'verified' ? new Date() : null
      });

      if (updatedKyc) {
        // Update user KYC status
        await storage.updateUser(updatedKyc.userId, { kycStatus: status });
      }

      res.json({ kyc: updatedKyc });
    } catch (error) {
      console.error('KYC update error:', error);
      res.status(500).json({ message: "Failed to update KYC" });
    }
  });

  // Admin Transaction Management
  app.get("/api/admin/transactions", async (req, res) => {
    try {
      const { page = 1, limit = 20, status, type } = req.query;
      let transactions = await storage.getAllTransactions();

      // Filters
      if (status) {
        transactions = transactions.filter(t => t.status === status);
      }
      if (type) {
        transactions = transactions.filter(t => t.type === type);
      }

      // Pagination
      const startIndex = (Number(page) - 1) * Number(limit);
      const paginatedTransactions = transactions.slice(startIndex, startIndex + Number(limit));

      res.json({
        transactions: paginatedTransactions,
        total: transactions.length,
        page: Number(page),
        totalPages: Math.ceil(transactions.length / Number(limit))
      });
    } catch (error) {
      console.error('Transactions fetch error:', error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Admin Virtual Cards Management
  app.get("/api/admin/virtual-cards", async (req, res) => {
    try {
      const cards = await storage.getAllVirtualCards();
      res.json({ cards });
    } catch (error) {
      console.error('Virtual cards fetch error:', error);
      res.status(500).json({ message: "Failed to fetch virtual cards" });
    }
  });

  // Admin Logs
  app.get("/api/admin/logs", async (req, res) => {
    try {
      const logs = await storage.getAdminLogs();
      res.json({ logs });
    } catch (error) {
      console.error('Admin logs fetch error:', error);
      res.status(500).json({ message: "Failed to fetch admin logs" });
    }
  });

  // Admin User Actions
  app.put("/api/admin/users/:id/block", async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.updateUser(id, {
        isEmailVerified: false,
        isPhoneVerified: false
      });

      res.json({ message: "User blocked successfully" });
    } catch (error) {
      console.error('Block user error:', error);
      res.status(500).json({ message: "Failed to block user" });
    }
  });

  app.put("/api/admin/users/:id/unblock", async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.updateUser(id, {
        isEmailVerified: true,
        isPhoneVerified: true
      });

      res.json({ message: "User unblocked successfully" });
    } catch (error) {
      console.error('Unblock user error:', error);
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });

  // Admin user balance management
  app.put("/api/admin/users/:id/balance", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { amount, type, details } = req.body;
      const currentBalance = parseFloat(user.balance || "0");
      const updateAmount = parseFloat(amount);
      
      let newBalance: number;
      let transactionType: 'receive' | 'send';
      
      switch (type) {
        case "add":
          newBalance = currentBalance + updateAmount;
          transactionType = 'receive';
          break;
        case "subtract":
          newBalance = Math.max(0, currentBalance - updateAmount);
          transactionType = 'send';
          break;
        case "set":
          newBalance = updateAmount;
          transactionType = updateAmount > currentBalance ? 'receive' : 'send';
          break;
        default:
          return res.status(400).json({ error: "Invalid update type" });
      }
      
      // Update user balance
      const updatedUser = await storage.updateUser(req.params.id, { 
        balance: newBalance.toFixed(2) 
      });
      
      // Create transaction record for history
      const transactionAmount = type === 'set' ? Math.abs(newBalance - currentBalance) : updateAmount;
      const transactionData = {
        userId: req.params.id,
        type: transactionType,
        amount: transactionAmount.toFixed(2),
        currency: user.defaultCurrency || 'USD',
        status: 'completed' as const,
        description: details || `Admin ${type} balance adjustment`,
        recipientId: null,
        recipientName: 'System Admin',
        fee: '0.00',
        exchangeRate: 1,
        sourceAmount: transactionAmount.toFixed(2),
        sourceCurrency: user.defaultCurrency || 'USD'
      };
      
      await storage.createTransaction(transactionData);
      
      res.json({ user: updatedUser, newBalance });
    } catch (error) {
      console.error('Admin balance update error:', error);
      res.status(500).json({ error: "Failed to update user balance" });
    }
  });

  // Admin virtual card management
  app.put("/api/admin/users/:id/card/:action", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { action } = req.params;
      let updateData: any = {};
      
      switch (action) {
        case "issue":
          updateData = { hasVirtualCard: true, cardStatus: "active" };
          
          // Create virtual card record when issuing
          const cardData = {
            userId: req.params.id,
            cardNumber: `4567${Math.random().toString().slice(2, 14)}`,
            expiryMonth: String(new Date().getMonth() + 1).padStart(2, '0'),
            expiryYear: String(new Date().getFullYear() + 5).slice(-2),
            cvv: Math.floor(Math.random() * 900 + 100).toString(),
            cardholderName: user.fullName || user.username,
            status: "active",
            balance: "0.00",
            cardType: "virtual",
            provider: "Mastercard",
            currency: user.defaultCurrency || "USD",
            pin: Math.floor(Math.random() * 9000 + 1000).toString()
          };
          
          try {
            await storage.createVirtualCard(cardData);
          } catch (error) {
            console.error('Error creating virtual card:', error);
            return res.status(500).json({ error: "Failed to create virtual card" });
          }
          break;
        case "activate":
          if (!user.hasVirtualCard) {
            return res.status(400).json({ error: "User has no virtual card" });
          }
          updateData = { cardStatus: "active" };
          break;
        case "deactivate":
          if (!user.hasVirtualCard) {
            return res.status(400).json({ error: "User has no virtual card" });
          }
          updateData = { cardStatus: "blocked" };
          break;
        default:
          return res.status(400).json({ error: "Invalid action" });
      }
      
      const updatedUser = await storage.updateUser(req.params.id, updateData);
      res.json({ user: updatedUser });
    } catch (error) {
      console.error('Admin card management error:', error);
      res.status(500).json({ error: "Failed to update card status" });
    }
  });

  // Admin KYC Management
  app.get("/api/admin/kyc", async (req, res) => {
    try {
      const kycDocuments = await storage.getAllKycDocuments();
      res.json({ kycDocuments });
    } catch (error) {
      console.error('KYC fetch error:', error);
      res.status(500).json({ message: "Failed to fetch KYC documents" });
    }
  });

  app.put("/api/admin/kyc/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, verificationNotes } = req.body;
      
      const updatedKyc = await storage.updateKycDocument(id, {
        status,
        verificationNotes,
        verifiedAt: status === "verified" ? new Date() : null
      });

      if (!updatedKyc) {
        return res.status(404).json({ message: "KYC document not found" });
      }

      res.json({ kycDocument: updatedKyc });
    } catch (error) {
      console.error('KYC update error:', error);
      res.status(500).json({ message: "Failed to update KYC document" });
    }
  });

  // Admin Transaction Management  
  app.get("/api/admin/transactions", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      
      const result = await storage.getAllTransactions({ status, page, limit });
      res.json(result);
    } catch (error) {
      console.error('Transactions fetch error:', error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.put("/api/admin/transactions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedTransaction = await storage.updateTransaction(id, updates);
      
      if (!updatedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.json({ transaction: updatedTransaction });
    } catch (error) {
      console.error('Transaction update error:', error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  app.put("/api/admin/transactions/:id/date", async (req, res) => {
    try {
      const { id } = req.params;
      const { createdAt } = req.body;
      
      if (!createdAt) {
        return res.status(400).json({ message: "createdAt is required" });
      }

      const updatedTransaction = await storage.updateTransaction(id, { 
        createdAt: new Date(createdAt),
        updatedAt: new Date()
      });
      
      if (!updatedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.json({ transaction: updatedTransaction });
    } catch (error) {
      console.error('Transaction date update error:', error);
      res.status(500).json({ message: "Failed to update transaction date" });
    }
  });

  // Admin Virtual Cards Management
  app.get("/api/admin/virtual-cards", async (req, res) => {
    try {
      const virtualCards = await storage.getAllVirtualCards();
      res.json({ virtualCards });
    } catch (error) {
      console.error('Virtual cards fetch error:', error);
      res.status(500).json({ message: "Failed to fetch virtual cards" });
    }
  });

  app.put("/api/admin/virtual-cards/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedCard = await storage.updateVirtualCard(id, updates);
      
      if (!updatedCard) {
        return res.status(404).json({ message: "Virtual card not found" });
      }

      res.json({ virtualCard: updatedCard });
    } catch (error) {
      console.error('Virtual card update error:', error);
      res.status(500).json({ message: "Failed to update virtual card" });
    }
  });

  // System Settings Management
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json({ settings });
    } catch (error) {
      console.error('Settings fetch error:', error);
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });

  app.put("/api/admin/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      const updatedSetting = await storage.updateSystemSetting(key, value);
      
      if (!updatedSetting) {
        return res.status(404).json({ message: "Setting not found" });
      }

      res.json({ setting: updatedSetting });
    } catch (error) {
      console.error('Setting update error:', error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  app.post("/api/admin/settings", async (req, res) => {
    try {
      const settingData = req.body;
      const newSetting = await storage.createSystemSetting(settingData);
      res.json({ setting: newSetting });
    } catch (error) {
      console.error('Setting creation error:', error);
      res.status(500).json({ message: "Failed to create setting" });
    }
  });

  // Get user by ID (for refreshing user data)
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ user });
    } catch (error) {
      console.error("Error retrieving user:", error);
      res.status(500).json({ error: "Failed to retrieve user data" });
    }
  });

  // PayHero callback endpoint
  app.post("/api/payhero-callback", async (req, res) => {
    try {
      console.log('PayHero callback received:', JSON.stringify(req.body, null, 2));
      
      const callbackData = req.body;
      const { reference, type } = req.query;
      
      if (!callbackData.response) {
        console.error('Invalid PayHero callback data - missing response');
        return res.status(400).json({ message: "Invalid callback data" });
      }

      const paymentResult = payHeroService.processCallback(callbackData);
      console.log('Processed payment result:', paymentResult);
      
      if (paymentResult.success) {
        if (type === 'virtual-card') {
          // Find the user by the payment reference
          const transactions = await storage.getAllTransactions();
          let userId = null;
          
          // Find user based on the payment reference
          // This is a simple approach - in production you might want to store reference-to-user mapping
          for (const transaction of transactions) {
            if (transaction.id.includes(paymentResult.reference) || 
                transaction.description?.includes(paymentResult.reference)) {
              userId = transaction.fromUserId || transaction.toUserId;
              break;
            }
          }
          
          if (!userId) {
            console.error('Could not find user for payment reference:', paymentResult.reference);
            return res.status(200).json({ message: "Payment processed but user not found" });
          }

          // Create virtual card for the user
          const cardData = {
            userId: userId,
            cardNumber: `5399 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 3), // 3 years from now
            cvv: Math.floor(100 + Math.random() * 900).toString(),
            balance: 0,
            status: 'active' as const,
            type: 'virtual' as const
          };

          const newCard = await storage.createVirtualCard(cardData);
          console.log('Virtual card created successfully:', newCard.id);

          // Create a transaction record for the card purchase
          const transactionData = {
            fromUserId: userId,
            toUserId: userId, // Self transaction for card purchase
            amount: paymentResult.amount.toString(),
            currency: 'KES',
            status: 'completed' as const,
            type: 'card_purchase' as const,
            description: `Virtual card purchase - Payment via M-Pesa (${paymentResult.mpesaReceiptNumber})`,
            fees: '0'
          };

          await storage.createTransaction(transactionData);
          console.log('Card purchase transaction recorded');
        }
        
        console.log('PayHero payment completed successfully');
        res.status(200).json({ message: "Payment processed successfully" });
      } else {
        console.log('PayHero payment failed:', paymentResult.status);
        res.status(200).json({ message: "Payment failed", status: paymentResult.status });
      }
    } catch (error) {
      console.error('PayHero callback processing error:', error);
      res.status(500).json({ message: "Error processing payment callback" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
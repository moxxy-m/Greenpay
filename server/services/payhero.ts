import fetch from 'node-fetch';

export interface PayHeroResponse {
  success: boolean;
  status: string;
  reference: string;
  CheckoutRequestID: string;
}

export interface PayHeroCallbackResponse {
  forward_url: string;
  response: {
    Amount: number;
    CheckoutRequestID: string;
    ExternalReference: string;
    MerchantRequestID: string;
    MpesaReceiptNumber: string;
    Phone: string;
    ResultCode: number;
    ResultDesc: string;
    Status: string;
  };
  status: boolean;
}

export class PayHeroService {
  private authToken: string;
  private channelId: number;
  private baseUrl = 'https://backend.payhero.co.ke/api/v2';

  constructor() {
    const authToken = process.env.PAYHERO_AUTH_TOKEN;
    const channelId = process.env.PAYHERO_CHANNEL_ID;
    
    if (!authToken) {
      throw new Error('PayHero auth token not provided. Please set PAYHERO_AUTH_TOKEN environment variable.');
    }
    
    if (!channelId) {
      throw new Error('PayHero channel ID not provided. Please set PAYHERO_CHANNEL_ID environment variable.');
    }
    
    this.authToken = authToken;
    this.channelId = parseInt(channelId);
  }

  /**
   * Generate a unique reference for PayHero transactions
   */
  generateReference(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `GPY${timestamp.slice(-8)}${random}`;
  }

  /**
   * Initiate M-Pesa STK Push payment
   */
  async initiateMpesaPayment(
    amount: number,
    phoneNumber: string,
    externalReference: string,
    customerName?: string,
    callbackUrl?: string
  ): Promise<PayHeroResponse> {
    try {
      const url = `${this.baseUrl}/payments`;
      
      // Clean phone number - remove + and ensure it starts with 254
      let cleanPhone = phoneNumber.replace(/\+/g, '').replace(/\s/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '254' + cleanPhone.substring(1);
      } else if (!cleanPhone.startsWith('254')) {
        cleanPhone = '254' + cleanPhone;
      }

      const payload = {
        amount: Math.round(amount), // PayHero expects integer amounts
        phone_number: cleanPhone,
        channel_id: this.channelId,
        provider: 'm-pesa',
        external_reference: externalReference,
        customer_name: customerName,
        callback_url: callbackUrl
      };

      console.log('PayHero payment request:', { 
        amount: payload.amount, 
        phone: payload.phone_number, 
        reference: externalReference,
        channel_id: payload.channel_id,
        url: url
      });
      
      // Try different auth header formats to troubleshoot
      let authHeader;
      let debugInfo = {
        tokenExists: !!this.authToken,
        originalLength: this.authToken.length,
        originalPrefix: this.authToken.substring(0, 15) + '...',
        channelId: this.channelId,
        attempts: []
      };

      // If token appears to start with something other than expected base64
      if (this.authToken.startsWith('MBasic') || this.authToken.includes('Basic')) {
        // Extract everything after any "Basic" occurrence
        const parts = this.authToken.split('Basic');
        if (parts.length > 1) {
          const cleanToken = parts[parts.length - 1].trim();
          authHeader = `Basic ${cleanToken}`;
          debugInfo.attempts.push(`Extracted after Basic: ${cleanToken.substring(0, 10)}...`);
        } else {
          authHeader = this.authToken;
          debugInfo.attempts.push(`Used as-is: ${this.authToken.substring(0, 15)}...`);
        }
      } else {
        // Assume it's a clean base64 token
        authHeader = `Basic ${this.authToken}`;
        debugInfo.attempts.push(`Added Basic prefix: Basic ${this.authToken.substring(0, 10)}...`);
      }
      
      console.log('Auth token troubleshooting:', debugInfo);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json() as any;
      
      console.log('PayHero HTTP response:', { 
        httpStatus: response.status, 
        success: data.success, 
        status: data.status, 
        reference: data.reference,
        error: data.error || data.message 
      });
      
      // Check for HTTP errors first
      if (!response.ok) {
        console.error('PayHero HTTP error:', response.status, data);
        return {
          success: false,
          status: `HTTP_${response.status}`,
          reference: '',
          CheckoutRequestID: ''
        };
      }
      
      return {
        success: data.success || false,
        status: data.status || 'FAILED',
        reference: data.reference || '',
        CheckoutRequestID: data.CheckoutRequestID || ''
      };
    } catch (error) {
      console.error('PayHero payment initiation error:', error);
      return {
        success: false,
        status: 'ERROR',
        reference: '',
        CheckoutRequestID: ''
      };
    }
  }

  /**
   * Verify payment status (polling method since PayHero doesn't have a direct verify endpoint)
   * In practice, you would track payment status via callbacks
   */
  async verifyPayment(checkoutRequestId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    // PayHero doesn't provide a direct verification endpoint like Paystack
    // Payment verification is handled via callbacks
    // This method is kept for compatibility but returns a warning
    console.warn('PayHero verification should be handled via callbacks. CheckoutRequestID:', checkoutRequestId);
    
    return {
      success: false,
      message: 'PayHero verification handled via callbacks only'
    };
  }

  /**
   * Process PayHero callback response
   */
  processCallback(callbackData: PayHeroCallbackResponse): {
    success: boolean;
    amount: number;
    reference: string;
    mpesaReceiptNumber?: string;
    status: string;
  } {
    const { response } = callbackData;
    
    return {
      success: response.ResultCode === 0 && response.Status === 'Success',
      amount: response.Amount,
      reference: response.ExternalReference,
      mpesaReceiptNumber: response.MpesaReceiptNumber,
      status: response.Status
    };
  }

  /**
   * Convert USD to KES (using a fixed rate for now, could be improved with real-time rates)
   */
  async convertUSDtoKES(usdAmount: number): Promise<number> {
    // Using approximate exchange rate - in production you might want to use a real-time API
    const exchangeRate = 129; // 1 USD = ~129 KES (approximate)
    return Math.round(usdAmount * exchangeRate);
  }
}

// Export singleton instance
export const payHeroService = new PayHeroService();
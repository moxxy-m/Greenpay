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
  private username: string;
  private password: string;
  private channelId: number;
  private baseUrl = 'https://backend.payhero.co.ke/api/v2';

  constructor() {
    const username = process.env.PAYHERO_USERNAME;
    const password = process.env.PAYHERO_PASSWORD;
    const channelId = process.env.PAYHERO_CHANNEL_ID;
    
    if (!username) {
      throw new Error('PayHero username not provided. Please set PAYHERO_USERNAME environment variable.');
    }
    
    if (!password) {
      throw new Error('PayHero password not provided. Please set PAYHERO_PASSWORD environment variable.');
    }
    
    if (!channelId) {
      throw new Error('PayHero channel ID not provided. Please set PAYHERO_CHANNEL_ID environment variable.');
    }
    
    this.username = username;
    this.password = password;
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
      
      // Format phone number to 07xxx format as required by PayHero
      let cleanPhone = phoneNumber.replace(/\+/g, '').replace(/\s/g, '');
      if (cleanPhone.startsWith('254')) {
        cleanPhone = '0' + cleanPhone.substring(3);
      } else if (!cleanPhone.startsWith('07')) {
        // Assume it's missing the 0 prefix
        if (cleanPhone.startsWith('7')) {
          cleanPhone = '0' + cleanPhone;
        }
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

      // Create proper Basic Auth header
      const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      const authHeader = `Basic ${credentials}`;

      console.log('PayHero payment request:', { 
        amount: payload.amount, 
        phone: payload.phone_number, 
        reference: externalReference,
        channel_id: payload.channel_id,
        url: url
      });

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
   * Check transaction status using PayHero's transaction-status endpoint
   */
  async checkTransactionStatus(reference: string): Promise<{ success: boolean; status: string; data?: any; message?: string }> {
    try {
      const url = `${this.baseUrl}/transaction-status?reference=${reference}`;
      
      // Create proper Basic Auth header
      const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      const authHeader = `Basic ${credentials}`;

      console.log('Checking PayHero transaction status:', { reference, url });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': authHeader
        }
      });

      const data = await response.json() as any;
      
      console.log('PayHero transaction status response:', { 
        httpStatus: response.status,
        reference,
        status: data.status,
        success: data.success
      });
      
      if (!response.ok) {
        console.error('PayHero transaction status HTTP error:', response.status, data);
        return {
          success: false,
          status: 'ERROR',
          message: data.message || 'Failed to check transaction status'
        };
      }
      
      return {
        success: true,
        status: data.status || 'UNKNOWN',
        data: data,
        message: data.message
      };
    } catch (error) {
      console.error('PayHero transaction status check error:', error);
      return {
        success: false,
        status: 'ERROR',
        message: 'Failed to check transaction status'
      };
    }
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
import fetch from 'node-fetch';

export interface PaystackResponse {
  status: boolean;
  message: string;
  data?: any;
}

export class PaystackService {
  private secretKey: string;
  private baseUrl = 'https://api.paystack.co';

  constructor() {
    // Use KES-specific key if available, otherwise fallback to general key
    const secretKey = process.env.PAYSTACK_SECRET_KEY_KES || process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      throw new Error('Paystack secret key not provided');
    }
    this.secretKey = secretKey;
  }

  async initializePayment(email: string, amount: number, reference: string, currency: string = 'KES', phoneNumber?: string): Promise<PaystackResponse> {
    try {
      const url = `${this.baseUrl}/transaction/initialize`;
      
      const payload: any = {
        email,
        amount: Math.round(amount * 100), // Convert to kobo for USD or cents for KES
        reference,
        currency,
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
      };

      // Add M-Pesa mobile money configuration for KES
      if (currency === 'KES' && phoneNumber) {
        payload.mobile_money = {
          phone: phoneNumber,
          provider: 'mpesa'
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as PaystackResponse;
      return data;
    } catch (error) {
      console.error('Paystack initialization error:', error);
      return {
        status: false,
        message: 'Payment initialization failed'
      };
    }
  }

  async verifyPayment(reference: string): Promise<PaystackResponse> {
    try {
      const url = `${this.baseUrl}/transaction/verify/${reference}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
        },
      });

      const data = await response.json() as PaystackResponse;
      return data;
    } catch (error) {
      console.error('Paystack verification error:', error);
      return {
        status: false,
        message: 'Payment verification failed'
      };
    }
  }

  async createCustomer(email: string, firstName: string, lastName: string, phone?: string): Promise<PaystackResponse> {
    try {
      const url = `${this.baseUrl}/customer`;
      
      const payload = {
        email,
        first_name: firstName,
        last_name: lastName,
        phone
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as PaystackResponse;
      return data;
    } catch (error) {
      console.error('Paystack customer creation error:', error);
      return {
        status: false,
        message: 'Customer creation failed'
      };
    }
  }

  async convertUSDtoKES(usdAmount: number): Promise<number> {
    try {
      // Import exchange rate service dynamically to avoid circular imports
      const { exchangeRateService } = await import('./exchange-rate');
      const rate = await exchangeRateService.getExchangeRate('USD', 'KES');
      return usdAmount * rate;
    } catch (error) {
      console.error('Currency conversion error:', error);
      // Fallback to static rate if API fails
      return usdAmount * 129; // Fallback KES rate
    }
  }

  generateReference(): string {
    return 'GP_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

export const paystackService = new PaystackService();
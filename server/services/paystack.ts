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
    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not provided');
    }
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
  }

  async initializePayment(email: string, amount: number, reference: string): Promise<PaystackResponse> {
    try {
      const url = `${this.baseUrl}/transaction/initialize`;
      
      const payload = {
        email,
        amount: Math.round(amount * 100), // Convert to kobo
        reference,
        currency: 'USD',
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
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

  generateReference(): string {
    return 'GP_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

export const paystackService = new PaystackService();
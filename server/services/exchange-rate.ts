import fetch from 'node-fetch';

export interface ExchangeRate {
  base: string;
  target: string;
  rate: number;
  timestamp: Date;
}

export class ExchangeRateService {
  private apiKey: string;
  private baseUrl = 'https://v6.exchangerate-api.com/v6';

  constructor() {
    if (!process.env.EXCHANGERATE_API_KEY) {
      throw new Error('Exchange rate API key not provided');
    }
    this.apiKey = process.env.EXCHANGERATE_API_KEY;
  }

  async getExchangeRate(from: string, to: string): Promise<number> {
    try {
      const url = `${this.baseUrl}/${this.apiKey}/pair/${from}/${to}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json() as any;
      
      if (data.result !== 'success') {
        throw new Error(`API error: ${data['error-type']}`);
      }
      
      return data.conversion_rate;
    } catch (error) {
      console.error('Exchange rate fetch error:', error);
      // Fallback rates for common African currencies
      const fallbackRates: Record<string, Record<string, number>> = {
        'USD': {
          'NGN': 820,
          'GHS': 12,
          'KES': 129,
          'ZAR': 18.5,
          'EGP': 31,
          'XOF': 605,
          'XAF': 605
        }
      };
      
      return fallbackRates[from]?.[to] || 1;
    }
  }

  async getMultipleRates(base: string, targets: string[]): Promise<Record<string, number>> {
    try {
      const url = `${this.baseUrl}/${this.apiKey}/latest/${base}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json() as any;
      
      if (data.result !== 'success') {
        throw new Error(`API error: ${data['error-type']}`);
      }
      
      const rates: Record<string, number> = {};
      targets.forEach(target => {
        rates[target] = data.conversion_rates[target] || 1;
      });
      
      return rates;
    } catch (error) {
      console.error('Multiple exchange rates fetch error:', error);
      // Return fallback rates
      const fallbackRates: Record<string, number> = {
        'NGN': 820,
        'GHS': 12,
        'KES': 129,
        'ZAR': 18.5,
        'EGP': 31,
        'XOF': 605,
        'XAF': 605
      };
      
      return Object.fromEntries(
        targets.map(target => [target, fallbackRates[target] || 1])
      );
    }
  }
}

export const exchangeRateService = new ExchangeRateService();
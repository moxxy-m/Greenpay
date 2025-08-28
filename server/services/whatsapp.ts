import fetch from 'node-fetch';

export class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;

  constructor() {
    if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error('WhatsApp credentials not provided');
    }
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  }

  async sendOTP(phoneNumber: string, otpCode: string): Promise<boolean> {
    try {
      const url = `https://graph.facebook.com/v17.0/${this.phoneNumberId}/messages`;
      
      const message = {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "template",
        template: {
          name: "otp_verification", // You need to create this template in WhatsApp Business
          language: {
            code: "en"
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: otpCode
                }
              ]
            }
          ]
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (response.ok) {
        console.log(`OTP sent successfully to ${phoneNumber}`);
        return true;
      } else {
        const error = await response.text();
        console.error('Failed to send OTP:', error);
        return false;
      }
    } catch (error) {
      console.error('WhatsApp OTP error:', error);
      return false;
    }
  }

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export const whatsappService = new WhatsAppService();
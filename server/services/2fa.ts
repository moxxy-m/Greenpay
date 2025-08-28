import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class TwoFactorService {
  generateSecret(userEmail: string): { secret: string; qrCodeUrl: string; backupCodes: string[] } {
    const secret = speakeasy.generateSecret({
      name: `GreenPay (${userEmail})`,
      issuer: 'GreenPay'
    });

    const backupCodes = this.generateBackupCodes();

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url || '',
      backupCodes
    };
  }

  async generateQRCode(secret: string, userEmail: string): Promise<string> {
    const otpAuthUrl = speakeasy.otpauthURL({
      secret,
      label: userEmail,
      issuer: 'GreenPay',
      encoding: 'base32'
    });

    return await QRCode.toDataURL(otpAuthUrl);
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 60 second window
    });
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
    }
    return codes;
  }
}

export const twoFactorService = new TwoFactorService();
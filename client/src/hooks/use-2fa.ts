import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

export function useSetup2FA() {
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/2fa/setup', {
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '2FA Setup',
        description: 'Scan the QR code with your authenticator app',
      });
    },
    onError: (error: any) => {
      toast({
        title: '2FA Setup Failed',
        description: error.message || 'Unable to set up 2FA',
        variant: 'destructive',
      });
    },
  });
}

export function useVerify2FA() {
  const queryClient = useQueryClient();
  const { user, login } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest('POST', '/api/auth/2fa/verify', {
        userId: user?.id,
        token,
      });
      return response.json();
    },
    onSuccess: () => {
      // Update user state
      if (user) {
        login({ ...user, twoFactorEnabled: true });
      }
      
      toast({
        title: '2FA Enabled',
        description: 'Two-factor authentication has been successfully enabled',
      });
    },
    onError: (error: any) => {
      toast({
        title: '2FA Verification Failed',
        description: error.message || 'Invalid verification code',
        variant: 'destructive',
      });
    },
  });
}

export function useBiometricSetup() {
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/biometric/setup', {
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Biometric Setup',
        description: 'Biometric authentication is being set up',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Biometric Setup Failed',
        description: error.message || 'Unable to set up biometric authentication',
        variant: 'destructive',
      });
    },
  });
}

export function useRegisterBiometric() {
  const queryClient = useQueryClient();
  const { user, login } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { credential: any; challenge: string }) => {
      const response = await apiRequest('POST', '/api/auth/biometric/register', {
        userId: user?.id,
        ...data,
      });
      return response.json();
    },
    onSuccess: () => {
      // Update user state
      if (user) {
        login({ ...user, biometricEnabled: true });
      }
      
      toast({
        title: 'Biometric Enabled',
        description: 'Biometric authentication has been successfully enabled',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Biometric Registration Failed',
        description: error.message || 'Unable to register biometric',
        variant: 'destructive',
      });
    },
  });
}
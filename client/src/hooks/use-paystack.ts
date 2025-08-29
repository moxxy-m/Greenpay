import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

export function useInitializeCardPayment() {
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/virtual-card/initialize-payment', {
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Paystack payment page
      window.open(data.authorizationUrl, '_blank');
    },
    onError: (error: any) => {
      toast({
        title: 'Payment Initialization Failed',
        description: error.message || 'Unable to initialize payment',
        variant: 'destructive',
      });
    },
  });
}

export function useVerifyCardPayment() {
  const queryClient = useQueryClient();
  const { user, login } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reference: string) => {
      const response = await apiRequest('POST', '/api/virtual-card/verify-payment', {
        reference,
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.card) {
        // Payment successful - update user state
        if (user) {
          login({ ...user, hasVirtualCard: true });
        }
        
        queryClient.invalidateQueries({ queryKey: ['virtual-card', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
        
        toast({
          title: 'Payment Successful!',
          description: 'Your virtual card has been activated.',
        });
      } else {
        // Payment failed
        queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
        toast({
          title: 'Payment Incomplete',
          description: data.message || 'Your payment was not completed successfully.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Payment Verification Failed',
        description: error.message || 'Unable to verify payment status',
        variant: 'destructive',
      });
    },
  });
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

export function useTransactions() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return { transactions: [] };
      const response = await apiRequest('GET', `/api/transactions/${user.id}`);
      return response.json();
    },
    enabled: !!user?.id,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });
}

export function useTransactionStatus(transactionId: string) {
  return useQuery({
    queryKey: ['transaction-status', transactionId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/transactions/status/${transactionId}`);
      return response.json();
    },
    enabled: !!transactionId,
    refetchInterval: 2000, // Check status every 2 seconds
  });
}

export function useSendMoney() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      amount: string;
      currency: string;
      targetCurrency: string;
      recipientDetails: any;
    }) => {
      const response = await apiRequest('POST', '/api/transactions/send', {
        userId: user?.id,
        ...data,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      toast({
        title: 'Transaction Initiated',
        description: `Sending ${data.transaction.amount} ${data.transaction.currency}. Processing...`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Transaction Failed',
        description: error.message || 'Unable to process transaction',
        variant: 'destructive',
      });
    },
  });
}

export function useReceiveMoney() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      amount: string;
      currency: string;
      senderDetails: any;
    }) => {
      const response = await apiRequest('POST', '/api/transactions/receive', {
        userId: user?.id,
        ...data,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      toast({
        title: 'Payment Received',
        description: `Received ${data.transaction.amount} ${data.transaction.currency}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Receive Failed',
        description: error.message || 'Unable to process incoming payment',
        variant: 'destructive',
      });
    },
  });
}
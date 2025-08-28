import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

export function useCurrencyExchange() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      amount: string;
      fromCurrency: string;
      toCurrency: string;
    }) => {
      const response = await apiRequest('POST', '/api/exchange/convert', {
        userId: user?.id,
        ...data,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      toast({
        title: 'Currency Exchanged',
        description: `Successfully converted ${data.transaction.amount} ${data.transaction.currency} to ${data.convertedAmount} ${data.transaction.metadata.targetCurrency}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Exchange Failed',
        description: error.message || 'Unable to process currency exchange',
        variant: 'destructive',
      });
    },
  });
}
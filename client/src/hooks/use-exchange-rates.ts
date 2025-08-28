import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: string;
}

export function useExchangeRate(from: string, to: string) {
  return useQuery({
    queryKey: ['exchange-rate', from, to],
    queryFn: async (): Promise<ExchangeRate> => {
      const response = await apiRequest('GET', `/api/exchange-rates/${from}/${to}`);
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 30000,
    enabled: !!(from && to),
  });
}

export function useMultipleExchangeRates(base: string = 'USD') {
  return useQuery({
    queryKey: ['exchange-rates', base],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/exchange-rates/${base}`);
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 30000,
  });
}

// Alias for compatibility
export const useExchangeRates = useMultipleExchangeRates;
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './use-auth';

export function usePaymentRequests() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['payment-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return { requests: [] };
      const response = await fetch(`/api/payment-requests/${user.id}`);
      return response.json();
    },
    enabled: !!user?.id,
  });
}
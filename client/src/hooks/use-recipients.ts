import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

export function useRecipients() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['recipients', user?.id],
    queryFn: async () => {
      if (!user?.id) return { recipients: [] };
      const response = await apiRequest('GET', `/api/recipients/${user.id}`);
      return response.json();
    },
    enabled: !!user?.id,
  });
}

export function useCreateRecipient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (recipientData: {
      name: string;
      phone?: string;
      email?: string;
      accountNumber?: string;
      bankName?: string;
      bankCode?: string;
      country: string;
      currency: string;
      recipientType: 'bank' | 'mobile_wallet' | 'cash_pickup';
    }) => {
      const response = await apiRequest('POST', '/api/recipients', {
        userId: user?.id,
        ...recipientData,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipients', user?.id] });
      toast({
        title: 'Recipient Added',
        description: 'New recipient has been saved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Add Recipient',
        description: error.message || 'Unable to save recipient',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateRecipient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/recipients/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipients', user?.id] });
      toast({
        title: 'Recipient Updated',
        description: 'Recipient details have been updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Unable to update recipient',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteRecipient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/recipients/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipients', user?.id] });
      toast({
        title: 'Recipient Deleted',
        description: 'Recipient has been removed from your list',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Unable to delete recipient',
        variant: 'destructive',
      });
    },
  });
}
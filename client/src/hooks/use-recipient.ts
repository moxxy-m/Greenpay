import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { InsertRecipient, Recipient } from '@shared/schema';

export function useRecipients() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['recipients', user?.id],
    queryFn: async (): Promise<{ recipients: Recipient[] }> => {
      const response = await apiRequest('GET', `/api/recipients/${user?.id}`);
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
    mutationFn: async (data: InsertRecipient) => {
      const response = await apiRequest('POST', '/api/recipients', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipients', user?.id] });
      toast({
        title: 'Recipient Added',
        description: 'Recipient has been successfully added to your list.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add recipient. Please try again.',
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<Recipient> }) => {
      const response = await apiRequest('PUT', `/api/recipients/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipients', user?.id] });
      toast({
        title: 'Recipient Updated',
        description: 'Recipient information has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update recipient. Please try again.',
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
        description: 'Recipient has been removed from your list.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete recipient. Please try again.',
        variant: 'destructive',
      });
    },
  });
}
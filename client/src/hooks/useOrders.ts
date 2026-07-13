import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Order, OrderStatus } from '@shared/types';

export const useOrdersQuery = (options?: any) => {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => api.get<Order[]>('/orders'),
    ...options,
  });
};

export const useOrderByIdQuery = (id: string, options?: any) => {
  return useQuery<Order & { items: any[] }>({
    queryKey: ['order', id],
    queryFn: () => api.get<Order & { items: any[] }>(`/orders/${id}`),
    enabled: !!id,
    ...options,
  });
};

export const usePlaceOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      addressId: string;
      paymentMethod: string;
      couponCode?: string;
      notes?: string;
      items: Array<{ productId: string; quantity: number }>;
    }) => api.post<{ order: Order; payment: any }>('/orders', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useVerifyPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      orderId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      signature: string;
    }) => api.post('/payments/verify', body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useUpdateOrderStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: OrderStatus; reason?: string }) =>
      api.post(`/orders/${id}/status`, { status, reason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useVerifyOTPHandoverMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, otp }: { id: string; otp: string }) =>
      api.post(`/orders/${id}/verify-otp`, { otp }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
export default useVerifyPaymentMutation;

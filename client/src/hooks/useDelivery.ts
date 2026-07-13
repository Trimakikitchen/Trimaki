import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { User, Order } from '@shared/types';

export const useRidersQuery = () => {
  return useQuery<User[]>({
    queryKey: ['riders'],
    queryFn: () => {
      // In production, fetch users with delivery role. Fallback to mock list.
      return api.get<User[]>('/users?role=delivery').catch(() => [
        { id: 'rider-1', fullName: 'Rajesh Kumar', email: 'rajesh@trimaki.com', phone: '+91 98765 43210', role: 'delivery', createdAt: new Date() },
        { id: 'rider-2', fullName: 'Amit Patel', email: 'amit@trimaki.com', phone: '+91 98765 43211', role: 'delivery', createdAt: new Date() },
        { id: 'rider-3', fullName: 'Vikram Singh', email: 'vikram@trimaki.com', phone: '+91 98765 43212', role: 'delivery', createdAt: new Date() },
      ] as User[]);
    },
  });
};

export const useAssignRiderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, riderId }: { orderId: string; riderId: string }) =>
      api.post<Order>(`/orders/${orderId}/status`, { status: 'out_for_delivery', riderId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
    },
  });
};
export default useAssignRiderMutation;

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { User, Order } from '@shared/types';

// ── Admin: list delivery partner users ──────────────────────────────────────
export const useRidersQuery = () => {
  return useQuery<User[]>({
    queryKey: ['riders'],
    queryFn: () => api.get<User[]>('/delivery/partners'),
  });
};

// ── Admin: assign delivery partner to an order ───────────────────────────────
export const useAssignRiderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, riderId }: { orderId: string; riderId: string }) =>
      api.post<Order>(`/delivery/orders/${orderId}/assign`, { deliveryPartnerId: riderId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
    },
  });
};

// ── Delivery partner: fetch own active orders ────────────────────────────────
export const useDeliveryActiveOrdersQuery = (options?: { refetchInterval?: number }) => {
  return useQuery<any[]>({
    queryKey: ['delivery-orders'],
    queryFn: () => api.get<any[]>('/delivery/orders'),
    refetchInterval: options?.refetchInterval ?? 15000,
  });
};

// ── Delivery partner: update status on an order ──────────────────────────────
export const useDeliveryStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.post(`/delivery/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
    },
  });
};

// ── Delivery partner: push GPS location ──────────────────────────────────────
export const useUpdateLocationMutation = () => {
  return useMutation({
    mutationFn: ({ orderId, lat, lng }: { orderId: string; lat: number; lng: number }) =>
      api.post(`/delivery/orders/${orderId}/location`, { lat, lng }),
  });
};

// ── Customer / Admin: poll delivery partner location for a specific order ────
export const useOrderLocationQuery = (orderId: string | null, enabled = true) => {
  return useQuery<{
    orderId: string;
    orderStatus: string;
    partnerName: string | null;
    deliveryLat: number | null;
    deliveryLng: number | null;
    destLat: number | null;
    destLng: number | null;
  }>({
    queryKey: ['order-location', orderId],
    queryFn: () => api.get(`/delivery/orders/${orderId}/location`),
    enabled: !!orderId && enabled,
    refetchInterval: 10000, // poll every 10 seconds
  });
};

export default useAssignRiderMutation;


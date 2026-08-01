import { useQuery, useMutation, useQueryClient, useQueryClient as useQC } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { User, Order } from '@shared/types';

// ── Real-time: subscribe to delivery location + status updates via WebSocket ─
export const useDeliverySocket = (orderId: string | null) => {
  const [location, setLocation] = useState<{
    lat: number | null;
    lng: number | null;
    partnerName: string | null;
  }>({ lat: null, lng: null, partnerName: null });
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const socket = getSocket();

    // Subscribe to this order's room
    socket.emit('join:order', orderId);

    const onLocation = (data: { orderId: string; lat: number; lng: number; partnerName: string }) => {
      if (data.orderId === orderId) {
        setLocation({ lat: data.lat, lng: data.lng, partnerName: data.partnerName });
      }
    };

    const onStatus = (data: { orderId: string; status: string }) => {
      if (data.orderId === orderId) {
        setStatus(data.status);
      }
    };

    socket.on('location:changed', onLocation);
    socket.on('status:changed', onStatus);

    return () => {
      socket.off('location:changed', onLocation);
      socket.off('status:changed', onStatus);
    };
  }, [orderId]);

  return { location, status };
};

// ── Delivery partner: emit GPS location via WebSocket (no HTTP round-trip) ──
export const useEmitLocation = () => {
  return useCallback((orderId: string, lat: number, lng: number) => {
    const socket = getSocket();
    socket.emit('location:update', { orderId, lat, lng });
  }, []);
};

// ── Delivery partner: emit status via WebSocket + invalidate queries ─────────
export const useEmitStatus = () => {
  const queryClient = useQC();
  return useCallback((orderId: string, status: string) => {
    const socket = getSocket();
    socket.emit('status:update', { orderId, status });
    // Optimistically invalidate so the delivery dashboard re-fetches
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
    }, 500);
  }, [queryClient]);
};



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


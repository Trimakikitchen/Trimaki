import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, CheckCircle2, Navigation, LogOut, Package, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  useDeliveryActiveOrdersQuery,
  useEmitLocation,
  useEmitStatus,
} from '../hooks/useDelivery';
import { getSocket } from '../services/socket';
import { disconnectSocket } from '../services/socket';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const STATUS_FLOW = [
  { key: 'out_for_delivery', label: 'Picked Up',    icon: '📦', color: 'text-blue-600 bg-blue-50' },
  { key: 'in_transit',       label: 'In Transit',   icon: '🛵', color: 'text-orange-600 bg-orange-50' },
  { key: 'near_doorstep',    label: 'Near Doorstep',icon: '📍', color: 'text-purple-600 bg-purple-50' },
  { key: 'delivered',        label: 'Delivered',    icon: '✅', color: 'text-green-600 bg-green-50' },
];

const nextStatus: Record<string, string> = {
  out_for_delivery: 'in_transit',
  in_transit:       'near_doorstep',
  near_doorstep:    'delivered',
};

const nextLabel: Record<string, string> = {
  out_for_delivery: '🛵 Mark In Transit',
  in_transit:       '📍 Near Doorstep',
  near_doorstep:    '✅ Mark Delivered',
};

export const DeliveryDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const emitLocation = useEmitLocation();
  const emitStatus   = useEmitStatus();
  const watchId      = useRef<number | null>(null);

  const { data: orders = [], isLoading, refetch } = useDeliveryActiveOrdersQuery({ refetchInterval: 30000 });

  // Redirect non-delivery users
  useEffect(() => {
    if (user && user.role !== 'delivery' && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Connect socket when dashboard mounts
  useEffect(() => {
    getSocket(); // ensure connected
    return () => {};
  }, []);

  // watchPosition: browser calls this whenever GPS changes — instantly emitted via WS
  useEffect(() => {
    if (!navigator.geolocation || orders.length === 0) return;

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        orders.forEach((order: any) => {
          emitLocation(order.id, pos.coords.latitude, pos.coords.longitude);
        });
      },
      (err) => console.warn('[GPS] Error:', err.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [orders, emitLocation]);

  const handleStatusUpdate = (orderId: string, status: string) => {
    emitStatus(orderId, status);
    // Re-fetch after short delay to remove delivered orders from list
    if (status === 'delivered') {
      setTimeout(() => refetch(), 1500);
    }
  };

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login');
  };

  const currentStatus = (order: any) =>
    STATUS_FLOW.find((s) => s.key === order.order_status) || STATUS_FLOW[0];

  const buildMapSrc = (order: any) => {
    if (!MAPS_API_KEY || !order.dest_lat || !order.dest_lng) return null;
    return `https://www.google.com/maps/embed/v1/directions?key=${MAPS_API_KEY}&origin=My+Location&destination=${order.dest_lat},${order.dest_lng}&mode=driving`;
  };

  const buildMapsLink = (order: any) =>
    `https://www.google.com/maps/dir/?api=1&destination=${order.dest_lat},${order.dest_lng}&travelmode=driving`;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400 leading-none">Delivery Partner</p>
            <p className="font-bold text-sm leading-tight">{user?.fullName || 'Rider'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full border border-green-400/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live GPS
          </span>
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
            <Package className="w-8 h-8 text-orange-400" />
            <div>
              <p className="text-2xl font-black">{orders.length}</p>
              <p className="text-xs text-gray-400">Active Orders</p>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-black">On</p>
              <p className="text-xs text-gray-400">Duty</p>
            </div>
          </div>
        </div>

        {/* Orders */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse space-y-3">
                <div className="h-4 bg-gray-800 rounded w-1/3" />
                <div className="h-3 bg-gray-800 rounded w-2/3" />
                <div className="h-10 bg-gray-800 rounded-xl" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-6xl">🎉</div>
            <p className="text-xl font-bold">All Clear!</p>
            <p className="text-gray-400 text-sm">No active orders assigned to you right now.</p>
          </div>
        ) : (
          orders.map((order: any) => {
            const status = currentStatus(order);
            const next = nextStatus[order.order_status];
            const mapSrc = buildMapSrc(order);

            return (
              <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                {/* Order header */}
                <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-lg tracking-tight">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">For: {order.customer_display}</p>
                  </div>
                  <p className="text-sm font-bold text-orange-400">₹{order.total}</p>
                </div>

                {/* Address */}
                <div className="mx-5 mb-4 flex items-start gap-2 bg-gray-800/50 rounded-xl p-3">
                  <MapPin className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold leading-tight">
                      {order.address_line}{order.apartment ? `, ${order.apartment}` : ''}
                    </p>
                    {order.landmark && <p className="text-xs text-gray-400 mt-0.5">Near: {order.landmark}</p>}
                    <p className="text-xs text-gray-500 mt-0.5">{order.city} — {order.pincode}</p>
                  </div>
                </div>

                {/* Map */}
                {mapSrc ? (
                  <div className="mx-5 mb-4 rounded-xl overflow-hidden border border-gray-700 h-44">
                    <iframe title={`map-${order.id}`} src={mapSrc} className="w-full h-full" allowFullScreen loading="lazy" />
                  </div>
                ) : order.dest_lat && order.dest_lng ? (
                  <div className="mx-5 mb-4">
                    <a href={buildMapsLink(order)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-colors">
                      <Navigation className="w-4 h-4" />
                      Open in Google Maps
                    </a>
                  </div>
                ) : null}

                {/* Progress bar */}
                <div className="px-5 mb-4">
                  <div className="flex items-center">
                    {STATUS_FLOW.map((s, idx) => {
                      const currentIdx = STATUS_FLOW.findIndex((x) => x.key === order.order_status);
                      const isDone = idx <= currentIdx;
                      return (
                        <React.Fragment key={s.key}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 transition-all ${isDone ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-700 text-gray-600'}`}>
                            {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                          </div>
                          {idx < STATUS_FLOW.length - 1 && (
                            <div className={`flex-1 h-0.5 transition-all ${isDone && idx < currentIdx ? 'bg-orange-500' : 'bg-gray-700'}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    {STATUS_FLOW.map((s) => (
                      <span key={s.key} className="text-[9px] text-gray-500 text-center" style={{ width: '25%' }}>
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action button */}
                {next ? (
                  <div className="px-5 pb-5">
                    <button
                      onClick={() => handleStatusUpdate(order.id, next)}
                      className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-black text-sm rounded-xl transition-all active:scale-95"
                    >
                      {nextLabel[order.order_status]}
                    </button>
                  </div>
                ) : (
                  <div className="px-5 pb-5">
                    <div className="w-full py-3.5 bg-green-900/40 border border-green-700 text-green-400 font-bold text-sm rounded-xl text-center">
                      ✅ Delivered — Great job!
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};

export default DeliveryDashboard;

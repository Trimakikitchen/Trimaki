import React, { useState } from 'react';
import { useOrdersQuery, useVerifyOTPHandoverMutation } from '../hooks/useOrders';
import { useRidersQuery, useAssignRiderMutation } from '../hooks/useDelivery';
import { Truck, ShieldAlert, MapPin, Navigation, ExternalLink } from 'lucide-react';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const AdminDelivery: React.FC = () => {
  const { data: orders, isLoading: ordersLoading } = useOrdersQuery();
  const { data: riders, isLoading: ridersLoading } = useRidersQuery();

  const assignRider = useAssignRiderMutation();
  const verifyOTP = useVerifyOTPHandoverMutation();

  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [otpVal, setOtpVal] = useState('');
  const [error, setError] = useState('');
  const [mapOrderId, setMapOrderId] = useState<string | null>(null);

  // Filter orders that are packed or in any delivery phase
  const dispatchOrders = orders?.filter((o) =>
    ['packed', 'out_for_delivery', 'in_transit', 'near_doorstep'].includes(o.orderStatus)
  );

  // Active deliveries: orders with a delivery partner assigned and in transit
  const activeDeliveries = orders?.filter((o) =>
    ['out_for_delivery', 'in_transit', 'near_doorstep'].includes(o.orderStatus) && o.deliveryPartnerId
  ) || [];

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!activeOrderId || !selectedRiderId) {
      setError('Please select a delivery executive.');
      return;
    }
    try {
      await assignRider.mutateAsync({ orderId: activeOrderId, riderId: selectedRiderId });
      setActiveOrderId(null);
      setSelectedRiderId('');
    } catch (err: any) {
      setError(err?.message || 'Failed to assign rider.');
    }
  };

  const handleVerifyOTP = async (orderId: string) => {
    setError('');
    if (!otpVal.trim() || otpVal.length !== 4) {
      setError('Please provide a valid 4-digit OTP code.');
      return;
    }
    try {
      await verifyOTP.mutateAsync({ id: orderId, otp: otpVal });
      setOtpVal('');
    } catch (err: any) {
      setError(err?.message || 'Failed to verify OTP code.');
    }
  };

  if (ordersLoading || ridersLoading) {
    return (
      <div className="bg-white border border-muted p-6 rounded-premium shadow-card animate-pulse space-y-4">
        <div className="h-10 bg-muted rounded" />
        <div className="h-44 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Dispatch Panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-4">
          <h3 className="font-extrabold text-charcoal text-base font-sans flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            <span>Operational Dispatch Panel</span>
          </h3>

          {!dispatchOrders || dispatchOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-medium space-y-2">
              <span className="text-4xl block">🚚📦</span>
              <p>All orders dispatched and delivered. Excellent work!</p>
            </div>
          ) : (
            <div className="divide-y divide-muted space-y-4">
              {dispatchOrders.map((o) => (
                <div key={o.id} className="pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <span className="font-bold text-charcoal text-sm">#{o.id.slice(0, 8)}</span>
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-black ${
                        o.orderStatus === 'packed' ? 'bg-primary/15 text-primary' :
                        o.orderStatus === 'in_transit' ? 'bg-orange-100 text-orange-700' :
                        o.orderStatus === 'near_doorstep' ? 'bg-purple-100 text-purple-700' :
                        'bg-accent/15 text-accent'
                      }`}>
                        {o.orderStatus === 'in_transit' ? '🛵 In Transit' :
                         o.orderStatus === 'near_doorstep' ? '📍 Near Doorstep' :
                         o.orderStatus}
                      </span>
                    </div>
                    <p className="text-xs text-muted-medium">Total: ₹{o.total}</p>
                    {o.deliveryPartnerName && (
                      <p className="text-xs text-muted-medium">Partner: {o.deliveryPartnerName}</p>
                    )}
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                    {o.orderStatus === 'packed' ? (
                      <button
                        onClick={() => setActiveOrderId(o.id)}
                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full"
                      >
                        Assign Rider
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setMapOrderId(mapOrderId === o.id ? null : o.id)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-blue-300 text-blue-700 hover:bg-blue-50 font-bold rounded text-xs"
                        >
                          <MapPin className="w-3 h-3" /> Track
                        </button>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="4-digit OTP"
                            maxLength={4}
                            value={otpVal}
                            onChange={(e) => setOtpVal(e.target.value)}
                            className="px-3 py-1.5 border border-muted-dark rounded text-xs w-24 text-center focus:outline-none"
                          />
                          <button
                            onClick={() => handleVerifyOTP(o.id)}
                            className="px-3 py-1.5 bg-success text-white hover:bg-success/90 font-bold rounded text-xs"
                          >
                            Verify OTP
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Inline map for selected order */}
                  {mapOrderId === o.id && (
                    <div className="w-full mt-2">
                      <OrderTrackMap orderId={o.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Fleet Overview */}
      <aside className="space-y-6">
        {/* Active Fleet */}
        <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-4">
          <h3 className="font-extrabold text-charcoal text-base font-sans flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            Active Delivery Fleet
          </h3>
          {activeDeliveries.length === 0 ? (
            <p className="text-xs text-muted-medium text-center py-4">No active deliveries in progress.</p>
          ) : (
            <div className="divide-y divide-muted space-y-3">
              {activeDeliveries.map((o) => (
                <div key={o.id} className="pt-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-charcoal">Order #{o.id.slice(0, 8)}</p>
                    <p className="text-[10px] text-muted-medium mt-0.5">
                      {o.orderStatus === 'in_transit' ? '🛵 In Transit' :
                       o.orderStatus === 'near_doorstep' ? '📍 Near Doorstep' :
                       '🚀 Out for Delivery'}
                    </p>
                  </div>
                  <button
                    onClick={() => setMapOrderId(mapOrderId === o.id ? null : o.id)}
                    className="flex items-center gap-1 px-2 py-1 border border-muted-dark rounded text-[10px] font-bold hover:bg-muted"
                  >
                    <MapPin className="w-3 h-3" />
                    {mapOrderId === o.id ? 'Hide' : 'View'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Delivery Partners */}
        <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-4">
          <h3 className="font-extrabold text-charcoal text-base font-sans">Delivery Partners</h3>
          {!riders || riders.length === 0 ? (
            <p className="text-xs text-muted-medium text-center py-4">
              No delivery partners found. Create users with role='delivery'.
            </p>
          ) : (
            <div className="divide-y divide-muted space-y-3">
              {(riders as any[]).map((rider) => (
                <div key={rider.id} className="pt-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-charcoal">{rider.fullName}</p>
                    <p className="text-[10px] text-muted-medium">{rider.phone}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                    Number(rider.activeOrders) > 0 ? 'bg-orange-100 text-orange-700' : 'bg-success/15 text-success'
                  }`}>
                    {Number(rider.activeOrders) > 0 ? `${rider.activeOrders} Active` : 'Available'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Assign Rider Modal */}
      {activeOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-muted p-6 rounded-premium shadow-premium max-w-sm w-full space-y-4">
            <h3 className="font-extrabold text-charcoal text-base font-sans">Select Dispatch Partner</h3>
            {error && <p className="text-xs text-accent font-bold">{error}</p>}
            <form onSubmit={handleAssign} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-charcoal/60">Riders</label>
                <select
                  value={selectedRiderId}
                  onChange={(e) => setSelectedRiderId(e.target.value)}
                  className="w-full px-3 py-2 border border-muted-dark rounded text-xs bg-white focus:outline-none"
                >
                  <option value="">Select Rider</option>
                  {(riders as any[])?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fullName} {Number(r.activeOrders) > 0 ? `(${r.activeOrders} active)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-muted">
                <button
                  type="button"
                  onClick={() => setActiveOrderId(null)}
                  className="px-4 py-2 border border-muted-dark rounded-full text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignRider.isPending}
                  className="px-5 py-2 bg-primary text-white font-bold text-xs rounded-full disabled:opacity-50"
                >
                  {assignRider.isPending ? 'Assigning...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Mini map component used inline in AdminDelivery
const OrderTrackMap: React.FC<{ orderId: string }> = ({ orderId }) => {
  const [locData, setLocData] = React.useState<any>(null);

  React.useEffect(() => {
    import('../services/api').then(({ default: api }) => {
      const poll = () => api.get(`/delivery/orders/${orderId}/location`).then(setLocData).catch(() => {});
      poll();
      const t = setInterval(poll, 10000);
      return () => clearInterval(t);
    });
  }, [orderId]);

  if (!locData || (!locData.deliveryLat && !locData.destLat)) {
    return <p className="text-xs text-muted-medium text-center py-3">Waiting for GPS signal from delivery partner...</p>;
  }

  if (MAPS_API_KEY && locData.deliveryLat && locData.destLat) {
    const src = `https://www.google.com/maps/embed/v1/directions?key=${MAPS_API_KEY}&origin=${locData.deliveryLat},${locData.deliveryLng}&destination=${locData.destLat},${locData.destLng}&mode=driving`;
    return <iframe title={`admin-map-${orderId}`} src={src} className="w-full h-52 rounded-xl border border-muted" loading="lazy" />;
  }

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${locData.destLat},${locData.destLng}`;
  return (
    <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-lg">
      <ExternalLink className="w-3.5 h-3.5" /> Open Delivery Route in Maps
    </a>
  );
};

export default AdminDelivery;


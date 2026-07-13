import React, { useState } from 'react';
import { useOrdersQuery, useVerifyOTPHandoverMutation } from '../hooks/useOrders';
import { useRidersQuery, useAssignRiderMutation } from '../hooks/useDelivery';
import { Truck, ShieldAlert, Award, Navigation, MapPin } from 'lucide-react';

export const AdminDelivery: React.FC = () => {
  const { data: orders, isLoading: ordersLoading } = useOrdersQuery();
  const { data: riders, isLoading: ridersLoading } = useRidersQuery();

  const assignRider = useAssignRiderMutation();
  const verifyOTP = useVerifyOTPHandoverMutation();

  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [otpVal, setOtpVal] = useState('');
  const [error, setError] = useState('');

  // Filter orders that are packed (ready for dispatch) or currently out for delivery
  const dispatchOrders = orders?.filter(
    (o) => o.orderStatus === 'packed' || o.orderStatus === 'out_for_delivery'
  );

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
      {/* List of active riders and orders */}
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
                        o.orderStatus === 'packed' ? 'bg-primary/15 text-primary' : 'bg-accent/15 text-accent'
                      }`}>
                        {o.orderStatus}
                      </span>
                    </div>
                    <p className="text-xs text-muted-medium">Total Billing: ₹{o.total}</p>
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto">
                    {o.orderStatus === 'packed' ? (
                      <button
                        onClick={() => setActiveOrderId(o.id)}
                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full"
                      >
                        Assign Rider
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
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
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Geocoding tracking overlay map placeholder */}
      <aside className="space-y-6">
        <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-4">
          <h3 className="font-extrabold text-charcoal text-base font-sans">Active Delivery Fleet</h3>
          <div className="divide-y divide-muted space-y-3">
            {riders?.map((rider) => (
              <div key={rider.id} className="pt-3 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-charcoal">{rider.fullName}</p>
                  <p className="text-[10px] text-muted-medium">{rider.phone}</p>
                </div>
                <span className="px-2 py-0.5 bg-success/15 text-success rounded text-[9px] font-black uppercase">
                  Available
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Assign Rider Overlay Form */}
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
                  {riders?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fullName}
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
export default AdminDelivery;

import React from 'react';
import { Clock, Play, CheckCircle, ArrowLeft } from 'lucide-react';
import { useOrdersQuery, useUpdateOrderStatusMutation } from '../hooks/useOrders';
import { OrderStatus } from '@shared/types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const KitchenDisplay: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Safeguard: Redirect if not kitchen or admin
  React.useEffect(() => {
    if (!user || (user.role !== 'kitchen' && user.role !== 'admin')) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Query all orders with 5-second polling
  const { data: orders, isLoading } = useOrdersQuery({
    refetchInterval: 5000,
    enabled: !!user,
  });

  const updateStatus = useUpdateOrderStatusMutation();

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
    } catch (err) {
      console.error('Failed to update kitchen order status', err);
    }
  };

  // Filter for orders in the kitchen (accepted or preparing)
  const kitchenOrders = orders?.filter(
    (o) => o.orderStatus === 'accepted' || o.orderStatus === 'preparing'
  ) || [];

  const getMinutesAgo = (dateStr: string | Date) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diffMs / 1000 / 60));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-charcoal text-white p-8 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-muted-medium">Loading prep monitor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal text-white p-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/')}
            className="p-2 bg-charcoal-light hover:bg-white/10 rounded-full border border-white/10 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-xs text-primary font-bold uppercase tracking-wider">Kitchen Display System</span>
            <h2 className="text-3xl font-extrabold font-sans">Active Prep Monitor</h2>
          </div>
        </div>
        <div className="text-xs font-semibold px-4 py-2 bg-charcoal-light rounded-full border border-white/10">
          Orders to Prep: {kitchenOrders.length}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kitchenOrders.map((o) => {
          // Format items array into text
          const itemsText = o.items
            ? o.items.map((item: any) => `${item.productName} (x${item.quantity})`).join(', ')
            : 'No items loaded';

          return (
            <div
              key={o.id}
              className={`border rounded-premium p-6 flex flex-col justify-between space-y-6 transition-all ${
                o.orderStatus === 'preparing'
                  ? 'border-primary/50 bg-charcoal-light/70 shadow-glow'
                  : 'border-white/10 bg-charcoal-light'
              }`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-muted-medium">Order ID</span>
                  <h4 className="text-xl font-bold font-sans text-white">#{o.id.slice(0, 8)}</h4>
                  <p className="text-xs text-primary font-medium mt-0.5">{o.customerName || 'Customer'}</p>
                </div>
                <div className="flex items-center gap-1.5 text-muted-medium text-xs font-bold bg-charcoal px-3 py-1.5 rounded-lg border border-white/5">
                  <Clock className="w-4 h-4 text-primary animate-pulse" />
                  <span>{getMinutesAgo(o.createdAt)}m ago</span>
                </div>
              </div>

              {/* Items and notes */}
              <div className="space-y-3 flex-grow">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-medium uppercase font-bold tracking-wide">Ordered Items</span>
                  <p className="text-sm font-semibold text-white leading-relaxed">{itemsText}</p>
                </div>
                {o.notes && (
                  <div className="bg-charcoal border border-white/5 p-3 rounded-lg text-xs italic text-warning">
                    * Note: "{o.notes}"
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                {o.orderStatus === 'accepted' ? (
                  <button
                    onClick={() => handleUpdateStatus(o.id, 'preparing')}
                    className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-4.5 h-4.5" />
                    <span>Start Preparing</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(o.id, 'packed')}
                    className="w-full py-3 bg-success hover:bg-success/90 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4.5 h-4.5" />
                    <span>Mark Ready & Packed</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {kitchenOrders.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-medium space-y-3">
            <span className="text-5xl block">🥢😴</span>
            <h4 className="font-bold text-white text-base">No orders to prepare right now.</h4>
            <p className="text-xs max-w-xs mx-auto text-muted-medium">
              New accepted orders will automatically pop up here when customers place them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default KitchenDisplay;

import React, { useState } from 'react';
import { useOrdersQuery, useUpdateOrderStatusMutation } from '../hooks/useOrders';
import { OrderStatus } from '@shared/types';

export const AdminOrders: React.FC = () => {
  const { data: orders, isLoading } = useOrdersQuery();
  const updateStatus = useUpdateOrderStatusMutation();

  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const exportCSV = () => {
    if (!orders || orders.length === 0) return;

    const headers = ['Order ID', 'Subtotal', 'Tax', 'Total', 'Payment Method', 'Order Status', 'Created At'];
    const rows = orders.map((o) => [
      o.id,
      o.subtotal,
      o.tax,
      o.total,
      o.paymentMethod,
      o.orderStatus,
      o.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trimaki_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-muted p-6 rounded-premium shadow-card animate-pulse space-y-4">
        <div className="h-10 bg-muted rounded" />
        <div className="h-44 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-extrabold text-charcoal text-base font-sans">Active Orders Table</h3>
        <button
          onClick={exportCSV}
          disabled={!orders || orders.length === 0}
          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-full disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-muted text-muted-medium uppercase font-bold">
              <th className="pb-3">Order ID</th>
              <th className="pb-3">Amount</th>
              <th className="pb-3">Payment</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted">
            {orders?.map((o) => (
              <tr key={o.id} className="text-charcoal/80">
                <td className="py-4 font-bold text-charcoal">{o.id.slice(0, 8)}</td>
                <td className="py-4 font-semibold">₹{o.total}</td>
                <td className="py-4 text-success capitalize">{o.paymentStatus} ({o.paymentMethod})</td>
                <td className="py-4">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded font-semibold uppercase text-[10px]">
                    {o.orderStatus}
                  </span>
                </td>
                <td className="py-4 text-right space-x-2">
                  {o.orderStatus === 'received' && (
                    <button
                      onClick={() => handleUpdateStatus(o.id, 'accepted')}
                      className="px-2.5 py-1 bg-success text-white hover:bg-success/90 font-bold rounded text-[10px]"
                    >
                      Accept
                    </button>
                  )}
                  {o.orderStatus === 'accepted' && (
                    <button
                      onClick={() => handleUpdateStatus(o.id, 'preparing')}
                      className="px-2.5 py-1 bg-primary text-white hover:bg-primary-hover font-bold rounded text-[10px]"
                    >
                      Prepare
                    </button>
                  )}
                  {o.orderStatus === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(o.id, 'packed')}
                      className="px-2.5 py-1 bg-charcoal text-white hover:bg-black font-bold rounded text-[10px]"
                    >
                      Pack
                    </button>
                  )}
                  {o.orderStatus === 'packed' && (
                    <button
                      onClick={() => handleUpdateStatus(o.id, 'out_for_delivery')}
                      className="px-2.5 py-1 bg-accent text-white hover:bg-accent/90 font-bold rounded text-[10px]"
                    >
                      Dispatch
                    </button>
                  )}
                  {o.orderStatus === 'out_for_delivery' && (
                    <button
                      onClick={() => handleUpdateStatus(o.id, 'delivered')}
                      className="px-2.5 py-1 bg-success text-white hover:bg-success/90 font-bold rounded text-[10px]"
                    >
                      Deliver
                    </button>
                  )}
                  {o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled' && (
                    <button
                      onClick={() => setCancellingOrderId(o.id)}
                      className="px-2.5 py-1 bg-muted hover:bg-muted-dark text-charcoal font-bold rounded text-[10px]"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cancellation Reason Modal */}
      {cancellingOrderId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-muted w-full max-w-md rounded-premium shadow-card p-6 space-y-4 font-sans text-left">
            <h3 className="font-extrabold text-charcoal text-base">Cancel Order</h3>
            <p className="text-xs text-muted-medium">
              Please provide a cancellation reason. The customer will receive an alert with this explanation.
            </p>
            <textarea
              placeholder="E.g., Out of stock, Kitchen closing, Delivery rider unavailable..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2 border border-muted-dark rounded-xl text-xs focus:outline-none focus:border-primary bg-muted/20 font-sans resize-none"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCancellingOrderId(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 border border-muted-dark rounded-full text-xs font-bold text-charcoal hover:bg-muted"
              >
                Back
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!cancelReason.trim()) return;
                  try {
                    await updateStatus.mutateAsync({
                      id: cancellingOrderId,
                      status: 'cancelled',
                      reason: cancelReason,
                    });
                    setCancellingOrderId(null);
                    setCancelReason('');
                  } catch (err) {
                    console.error('Failed to cancel order', err);
                  }
                }}
                disabled={!cancelReason.trim()}
                className="px-4 py-2 bg-accent text-white font-bold text-xs rounded-full hover:bg-accent/90 disabled:opacity-50"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminOrders;

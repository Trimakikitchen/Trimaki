import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ChatWidget } from '../components/ChatWidget';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrdersQuery } from '../hooks/useOrders';
import { OrderStatus } from '@shared/types';
import { ChevronRight } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { items, subtotal } = useCart();
  const [dismissedOrders, setDismissedOrders] = useState<string[]>([]);

  // Poll active orders list
  const { data: orders } = useOrdersQuery({
    refetchInterval: 5000,
    enabled: !!user,
  });

  // Track both active and cancelled orders
  const activeOrders = orders?.filter(
    (o) => o.orderStatus !== 'delivered'
  ) || [];

  const activeOrder = activeOrders[0];

  const getDisplayStatus = (status: OrderStatus) => {
    switch (status) {
      case 'received': return 'Order Placed';
      case 'accepted': return 'Order Accepted';
      case 'preparing':
      case 'packed': return 'In Kitchen';
      case 'out_for_delivery': return 'In Transit';
      case 'cancelled': return 'Cancelled';
      default: return 'Pending';
    }
  };

  const isCartPageVisible =
    location.pathname === '/' ||
    location.pathname === '/menu' ||
    location.pathname === '/offers';

  const isTrackPage = location.pathname === '/track-order';

  const showTrackBar = !isTrackPage && !!activeOrder && !!user && !dismissedOrders.includes(activeOrder.id);
  const showCartBar = isCartPageVisible && items.length > 0;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col min-h-screen relative">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />

      {/* Floating Sticky Track Order Bar */}
      {showTrackBar && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-xl z-40 animate-slide-up">
          <div className="relative group">
            <Link
              to={`/track-order?id=${activeOrder.id}`}
              className="bg-charcoal hover:bg-charcoal/90 text-white px-6 py-4 rounded-full flex justify-between items-center shadow-glow border border-primary/40 font-sans hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer block pr-12"
            >
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${activeOrder.orderStatus === 'cancelled' ? 'bg-accent animate-pulse' : 'bg-primary animate-ping'}`}></span>
                <span className={`text-xs font-bold uppercase tracking-wider ${activeOrder.orderStatus === 'cancelled' ? 'text-accent' : 'text-primary'}`}>
                  Track Order #{activeOrder.id.slice(0, 8)}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs px-2.5 py-0.5 rounded font-black uppercase text-[10px] ${
                  activeOrder.orderStatus === 'cancelled'
                    ? 'bg-accent/15 text-accent border border-accent/25'
                    : 'bg-primary/10 text-primary border border-primary/20'
                }`}>
                  {getDisplayStatus(activeOrder.orderStatus)}
                </span>
                {activeOrder.orderStatus !== 'cancelled' && (
                  <span className="text-xs text-muted-medium font-bold">
                    {activeOrder.orderStatus === 'out_for_delivery' ? '10 Mins' : '25 Mins'}
                  </span>
                )}
                <ChevronRight className={`w-5 h-5 ${activeOrder.orderStatus === 'cancelled' ? 'text-accent' : 'text-primary animate-pulse'}`} />
              </div>
            </Link>
            
            {/* Dismiss Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setDismissedOrders((prev) => [...prev, activeOrder.id]);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-medium hover:text-white transition-colors bg-charcoal/50 p-1.5 rounded-full z-50 cursor-pointer"
              title="Dismiss"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating Sticky Cart Summary Bar */}
      {showCartBar && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-xl z-40 animate-slide-up transition-all duration-300 ${
            showTrackBar ? 'bottom-24' : 'bottom-6'
          }`}
        >
          <Link
            to="/cart"
            className="bg-primary hover:bg-primary-hover text-white px-6 py-4 rounded-full flex justify-between items-center shadow-glow font-sans hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-black">
                {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
              </div>
              <span className="text-sm font-bold tracking-wide">View Cart</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black">₹{subtotal.toFixed(2)}</span>
              <ChevronRight className="w-5 h-5 animate-pulse" />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};
export default MainLayout;

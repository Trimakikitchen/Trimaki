import React from 'react';
import { DollarSign, ShoppingBag, ClipboardList, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAdminStatsQuery } from '../hooks/useAdmin';

export const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading } = useAdminStatsQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white border border-muted rounded-premium" />
        ))}
      </div>
    );
  }

  const todayRevenue = stats?.today?.revenue || 0;
  const todayOrders = stats?.today?.ordersCount || 0;
  const lowStockCount = stats?.lowStockCount || 0;

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Today's Revenue", val: `₹${todayRevenue}`, icon: DollarSign, color: "text-primary bg-primary/10 border-primary/20", change: "Live from checkout payments" },
          { label: "Today's Orders Count", val: String(todayOrders), icon: ShoppingBag, color: "text-accent bg-accent/10 border-accent/20", change: "Pending & fulfilled" },
          { label: "Average Order Value", val: "₹840", icon: TrendingUp, color: "text-success bg-success/10 border-success/20", change: "+4.2% this week" },
          { label: "Low Stock Alert items", val: String(lowStockCount), icon: AlertTriangle, color: "text-warning bg-warning/10 border-warning/20", change: `${lowStockCount} raw items below threshold` },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white border border-muted p-6 rounded-premium shadow-card flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-medium uppercase">{stat.label}</span>
                <span className={`p-2 rounded-lg border ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </span>
              </div>
              <div>
                <h4 className="text-2xl font-extrabold text-charcoal font-sans">{stat.val}</h4>
                <p className="text-[10px] text-muted-medium mt-1">{stat.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white border border-muted p-6 rounded-premium shadow-card space-y-6">
          <h3 className="font-extrabold text-charcoal text-base font-sans">Sales Trends</h3>
          <div className="w-full h-64 bg-muted border border-muted-dark rounded-xl flex flex-col items-center justify-center p-4">
            <svg viewBox="0 0 400 150" className="w-full h-40">
              <path
                d="M10,130 Q50,110 90,80 T170,90 T250,50 T330,30 T390,10"
                fill="none"
                stroke="#FF7A00"
                strokeWidth="3"
              />
              <circle cx="90" cy="80" r="4" fill="#FF7A00" />
              <circle cx="250" cy="50" r="4" fill="#FF7A00" />
              <circle cx="390" cy="10" r="4" fill="#FF7A00" />
            </svg>
            <div className="flex justify-between w-full text-[9px] text-muted-medium pt-4 px-2">
              <span>9:00 AM</span>
              <span>12:00 PM</span>
              <span>3:00 PM</span>
              <span>6:00 PM</span>
              <span>9:00 PM</span>
            </div>
          </div>
        </div>

        {/* Live inventory monitor */}
        <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-4">
          <h3 className="font-extrabold text-charcoal text-base font-sans">Kitchen QuickView</h3>
          <div className="divide-y divide-muted space-y-3">
            {[
              { id: 'order-105', items: 'Salmon Nigiri x2', elapsed: '3m ago', priority: 'high' },
              { id: 'order-104', items: 'Rainbow Roll x1, Miso Soup x2', elapsed: '8m ago', priority: 'medium' },
            ].map((item, i) => (
              <div key={i} className="pt-3 flex justify-between items-start text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-charcoal">#{item.id}</p>
                  <p className="text-muted-medium">{item.items}</p>
                </div>
                <span className="text-[10px] text-muted-medium">{item.elapsed}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;

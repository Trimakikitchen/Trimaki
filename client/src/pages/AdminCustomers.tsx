import React from 'react';

export const AdminCustomers: React.FC = () => {
  return (
    <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-6">
      <h3 className="font-extrabold text-charcoal text-base font-sans">Customer CRM Registry</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-muted text-muted-medium uppercase font-bold">
              <th className="pb-3">Customer</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Phone</th>
              <th className="pb-3">Orders Count</th>
              <th className="pb-3">Total Spend</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted">
            {[
              { name: 'John Doe', email: 'john@example.com', phone: '+91 99999 11111', orders: 12, spend: '₹14,240', status: 'Active' },
              { name: 'Alice Sen', email: 'alice@example.com', phone: '+91 99999 22222', orders: 5, spend: '₹4,890', status: 'Active' },
            ].map((c, i) => (
              <tr key={i} className="text-charcoal/80">
                <td className="py-4 font-bold text-charcoal">{c.name}</td>
                <td className="py-4">{c.email}</td>
                <td className="py-4">{c.phone}</td>
                <td className="py-4 font-semibold">{c.orders}</td>
                <td className="py-4 text-primary font-bold">{c.spend}</td>
                <td className="py-4">
                  <span className="px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded font-semibold text-[10px]">
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AdminCustomers;

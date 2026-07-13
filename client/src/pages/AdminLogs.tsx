import React from 'react';

export const AdminLogs: React.FC = () => {
  return (
    <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-6">
      <h3 className="font-extrabold text-charcoal text-base font-sans">Audit Logs</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-muted text-muted-medium uppercase font-bold">
              <th className="pb-3">Timestamp</th>
              <th className="pb-3">User</th>
              <th className="pb-3">Action</th>
              <th className="pb-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted">
            {[
              { time: 'Jul 12, 14:15', user: 'Admin (Rohan)', action: 'Inventory Stock Adjustment', details: 'Added 5.0 kg of fresh Salmon.' },
              { time: 'Jul 12, 11:30', user: 'Admin (Rohan)', action: 'Price Update', details: 'Updated Rainbow Roll price to ₹999.' },
            ].map((log, i) => (
              <tr key={i} className="text-charcoal/80">
                <td className="py-4 text-muted-medium">{log.time}</td>
                <td className="py-4 font-bold text-charcoal">{log.user}</td>
                <td className="py-4 font-semibold text-primary">{log.action}</td>
                <td className="py-4 italic">"{log.details}"</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AdminLogs;

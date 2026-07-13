import React, { useState } from 'react';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    radius: 8,
    fee: 50,
    minOrder: 300,
    tax: 5,
  });

  return (
    <div className="bg-white border border-muted p-8 rounded-premium shadow-card space-y-6 max-w-xl">
      <h3 className="font-extrabold text-charcoal text-lg font-sans">Business Settings</h3>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-charcoal/60">Delivery Radius (km)</label>
          <input
            type="number"
            value={settings.radius}
            onChange={(e) => setSettings({ ...settings, radius: Number(e.target.value) })}
            className="w-full px-4 py-2.5 border border-muted-dark rounded-lg text-xs font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-charcoal/60">Flat Delivery Fee (₹)</label>
          <input
            type="number"
            value={settings.fee}
            onChange={(e) => setSettings({ ...settings, fee: Number(e.target.value) })}
            className="w-full px-4 py-2.5 border border-muted-dark rounded-lg text-xs font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-charcoal/60">Minimum Order Value (₹)</label>
          <input
            type="number"
            value={settings.minOrder}
            onChange={(e) => setSettings({ ...settings, minOrder: Number(e.target.value) })}
            className="w-full px-4 py-2.5 border border-muted-dark rounded-lg text-xs font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-charcoal/60">GST Tax Percentage (%)</label>
          <input
            type="number"
            value={settings.tax}
            onChange={(e) => setSettings({ ...settings, tax: Number(e.target.value) })}
            className="w-full px-4 py-2.5 border border-muted-dark rounded-lg text-xs font-bold"
          />
        </div>

        <button className="px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-full hover:bg-primary-hover transition-colors mt-4">
          Save Settings
        </button>
      </div>
    </div>
  );
};
export default AdminSettings;

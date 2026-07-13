import React from 'react';

export const AdminCoupons: React.FC = () => {
  return (
    <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-extrabold text-charcoal text-base font-sans">Active Coupons</h3>
        <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-full">+ Create Coupon Code</button>
      </div>

      <div className="space-y-4">
        {[
          { code: 'TRIMAKI50', desc: '50% off up to ₹150', min: '₹500', active: true },
          { code: 'BENTOLOVE', desc: 'Flat ₹200 off on 2+ Bentos', min: '₹800', active: true },
        ].map((c, i) => (
          <div key={i} className="flex justify-between items-center p-4 bg-muted/50 rounded-xl text-xs">
            <div>
              <p className="font-extrabold text-primary text-sm">{c.code}</p>
              <p className="text-charcoal/80 font-bold mt-0.5">{c.desc}</p>
              <p className="text-muted-medium font-medium">Min Order: {c.min}</p>
            </div>
            <span className="px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded font-semibold">Active</span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AdminCoupons;

import React from 'react';

export const AdminOffers: React.FC = () => {
  return (
    <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-extrabold text-charcoal text-base font-sans">Homepage Offers & Banners</h3>
        <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-full">+ Create Offer Banner</button>
      </div>

      <div className="space-y-4">
        {[
          { title: 'Happy Hour Sake & Sushi Combos', duration: 'Jul 01 - Jul 31', active: true },
          { title: 'First Order Premium Delight', duration: 'Yearly active', active: true },
        ].map((off, i) => (
          <div key={i} className="flex justify-between items-center p-4 bg-muted/50 rounded-xl text-xs">
            <div>
              <p className="font-bold text-charcoal">{off.title}</p>
              <p className="text-muted-medium font-medium">Duration: {off.duration}</p>
            </div>
            <span className="px-2.5 py-0.5 bg-success/10 text-success border border-success/20 rounded-full font-bold text-[9px] uppercase">
              Active
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AdminOffers;

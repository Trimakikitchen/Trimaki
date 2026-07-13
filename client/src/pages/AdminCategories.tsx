import React from 'react';

export const AdminCategories: React.FC = () => {
  return (
    <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-extrabold text-charcoal text-base font-sans">Menu Categories</h3>
        <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-full">+ Add Category</button>
      </div>

      <div className="space-y-4">
        {[
          { name: 'Signature Rolls', slug: 'rolls', order: 1, active: true },
          { name: 'Classic Nigiri', slug: 'nigiri', order: 2, active: true },
        ].map((c, i) => (
          <div key={i} className="flex justify-between items-center p-4 bg-muted/50 rounded-xl text-xs">
            <div>
              <p className="font-bold text-charcoal">{c.name}</p>
              <p className="text-muted-medium font-medium">Slug: {c.slug} | Order: {c.order}</p>
            </div>
            <span className="px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded font-semibold">Active</span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AdminCategories;

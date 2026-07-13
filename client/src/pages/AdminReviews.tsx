import React from 'react';
import { Star } from 'lucide-react';

export const AdminReviews: React.FC = () => {
  return (
    <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-6">
      <h3 className="font-extrabold text-charcoal text-base font-sans">Reviews & Feedback Moderation</h3>

      <div className="space-y-4">
        {[
          { cust: 'Alice Sen', prod: 'Truffle Shiitake Nigiri', rate: 5, comment: 'Absolutely sensational. Truffle flavor was perfectly balanced!', approved: true },
          { cust: 'Bob Kumar', prod: 'Premium California Roll', rate: 4, comment: 'Very fresh, but packaging could include extra soy packets.', approved: false },
        ].map((rev, i) => (
          <div key={i} className="p-5 border border-muted-dark rounded-xl space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-charcoal">{rev.cust}</p>
                <p className="text-muted-medium font-medium">Product: {rev.prod}</p>
              </div>
              <div className="flex items-center text-warning gap-0.5 font-bold">
                <Star className="w-3.5 h-3.5 fill-warning" />
                <span>{rev.rate}</span>
              </div>
            </div>
            <p className="text-charcoal/80 leading-relaxed italic">"{rev.comment}"</p>
            <div className="flex justify-end gap-2 pt-2 border-t border-muted">
              {rev.approved ? (
                <span className="px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded font-semibold">Approved & Public</span>
              ) : (
                <>
                  <button className="px-3 py-1.5 bg-success text-white hover:bg-success/90 font-bold rounded-lg transition-colors">
                    Approve
                  </button>
                  <button className="px-3 py-1.5 bg-accent/15 text-accent hover:bg-accent/25 font-bold rounded-lg transition-colors">
                    Reject / Archive
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AdminReviews;

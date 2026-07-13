import React from 'react';
import { Tag, Sparkles, AlertCircle } from 'lucide-react';

export const Offers: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h2 className="text-3xl font-extrabold text-charcoal font-sans">Exclusive Culinary Offers</h2>
        <p className="text-muted-medium text-sm">Save on premium dining with curated offers and promo codes.</p>
      </div>

      {/* Main Promo Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          {
            title: 'Happy Hour Sake & Sushi Combos',
            subtitle: 'Get 20% off all Bento Box Combos between 3:00 PM and 6:00 PM every weekday.',
            code: 'HAPPYHOUR20',
            bg: 'bg-charcoal text-white',
          },
          {
            title: 'First Order Premium Delight',
            subtitle: 'New to TRIMAKI? Enjoy a complimentary orders with minimum purchases above ₹1,000.',
            code: 'WELCOMEFRESH',
            bg: 'bg-primary text-white shadow-glow',
          },
        ].map((offer, i) => (
          <div
            key={i}
            className={`${offer.bg} p-8 rounded-premium flex flex-col justify-between space-y-6 relative overflow-hidden`}
          >
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Featured Offer
              </span>
              <h3 className="text-2xl font-extrabold font-sans leading-tight">{offer.title}</h3>
              <p className="text-sm opacity-80 leading-relaxed">{offer.subtitle}</p>
            </div>
            <div className="flex justify-between items-center border-t border-white/10 pt-4">
              <span className="text-xs opacity-75">Coupon Code</span>
              <span className="px-4 py-2 bg-white text-charcoal text-sm font-black rounded-lg tracking-widest uppercase">
                {offer.code}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Small Promo Codes List */}
      <div className="bg-white border border-muted p-8 rounded-premium shadow-card space-y-6">
        <h3 className="font-extrabold text-charcoal text-lg font-sans flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary" />
          <span>Active Promo Codes</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { code: 'TRIMAKI50', desc: '50% off up to ₹150 on orders above ₹500.', info: 'Applies to all products.' },
            { code: 'BENTOLOVE', desc: 'Flat ₹200 off on ordering 2 or more Bento combos.', info: 'Applies on Bento category.' },
            { code: 'FREEDELIVERY', desc: 'Free secure delivery on orders above ₹799.', info: 'Applies to all carts.' },
          ].map((item, i) => (
            <div key={i} className="p-5 bg-muted/50 border border-muted rounded-xl space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-sm font-black text-primary tracking-wider">{item.code}</span>
                <p className="text-xs font-bold text-charcoal leading-relaxed">{item.desc}</p>
              </div>
              <p className="text-[10px] text-muted-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>{item.info}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Offers;

import React from 'react';
import { ShieldCheck, Heart, Award, Utensils } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Title & Introduction banner */}
      <section className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-xs text-primary font-bold uppercase tracking-wider">Our Story</span>
        <h2 className="text-4xl font-extrabold text-charcoal font-sans">Crafting Luxury Japanese Dining At Home</h2>
        <p className="text-muted-medium text-sm leading-relaxed">
          TRIMAKI was born from a simple obsession: to deliver premium, restaurant-quality sushi rolls straight to your door without compromising on taste, temperature, or aesthetic presentation.
        </p>
      </section>

      {/* Narrative grid details */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="w-full h-80 bg-charcoal border border-charcoal-light rounded-premium flex items-center justify-center text-6xl">
          👨‍🍳🍣
        </div>
        <div className="space-y-6">
          <h3 className="text-2xl font-extrabold text-charcoal font-sans">The Cold-Chain Promise</h3>
          <p className="text-xs text-muted-medium leading-relaxed">
            Unlike standard food items, fresh sashimi and nigiri must remain chilled at a steady 2°C to 4°C to retain raw flavor notes. Every order from TRIMAKI is packed in high-density insulation sheets paired with food-safe cooling gels.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-muted rounded-xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-bold text-xs text-charcoal">FSSAI Certified</h4>
                <p className="text-[10px] text-muted-medium mt-0.5">Strict sanitization checks.</p>
              </div>
            </div>
            <div className="p-4 bg-white border border-muted rounded-xl flex items-start gap-3">
              <Award className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-bold text-xs text-charcoal">Imported Rice</h4>
                <p className="text-[10px] text-muted-medium mt-0.5">Aki-Komachi grains.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
export default About;

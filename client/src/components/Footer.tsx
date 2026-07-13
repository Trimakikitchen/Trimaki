import React from 'react';
import { Mail, Phone, Instagram, Facebook, Twitter } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-charcoal text-white pt-16 pb-8 border-t border-charcoal-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:justify-between gap-12 md:gap-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <span className="text-2xl font-extrabold tracking-wider font-sans">
              TRI<span className="text-primary">MAKI</span>
            </span>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-muted-medium hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-medium hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-medium hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Operational Hours */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold tracking-wider font-sans text-primary">BUSINESS HOURS</h3>
            <div className="space-y-2 text-sm text-muted-medium">
              <p className="flex gap-4">
                <span className="w-24 flex-shrink-0">Mon — Thu:</span>
                <span className="text-white">12:00 PM - 11:00 PM</span>
              </p>
              <p className="flex gap-4">
                <span className="w-24 flex-shrink-0">Fri — Sun:</span>
                <span className="text-white">11:00 AM - 12:30 AM</span>
              </p>
              <p className="pt-2 text-xs italic text-primary/80">
                Delivery kitchen is open for late night delivery on weekends.
              </p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold tracking-wider font-sans text-primary">CONTACT US</h3>
            <ul className="space-y-3.5 text-sm text-muted-medium">
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <span>support@trimaki.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-charcoal-light mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-muted-medium gap-4">
          <p>© {new Date().getFullYear()} TRIMAKI Sushi Kitchen. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;

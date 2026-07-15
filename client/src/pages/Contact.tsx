import React from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';

export const Contact: React.FC = () => {
  const [state, handleSubmit] = useForm('xeeyoqzg');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h2 className="text-3xl font-extrabold text-charcoal font-sans">Contact Our Concierge</h2>
        <p className="text-muted-medium text-sm">Have special events, inquiries, or feedback? Get in touch.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Side: Contact Form */}
        <div className="bg-white border border-muted p-8 rounded-premium shadow-card space-y-6">
          <h3 className="font-extrabold text-charcoal text-lg font-sans">Send Us a Message</h3>
          {state.succeeded ? (
            <div className="bg-success/10 border border-success/20 text-success p-4 rounded-xl text-sm font-semibold">
              Thank you! Your inquiry has been forwarded to our support concierge.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form-level errors from Formspree */}
              {state.errors && state.errors.getFormErrors().length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-semibold">
                  {state.errors.getFormErrors().map((error, i) => (
                    <p key={i}>{error.message}</p>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="name" className="text-xs font-bold uppercase text-charcoal/60">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 py-2.5 border border-muted-dark rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                  <ValidationError prefix="Name" field="name" errors={state.errors} className="text-xs text-red-500" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="email" className="text-xs font-bold uppercase text-charcoal/60">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-2.5 border border-muted-dark rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                  <ValidationError prefix="Email" field="email" errors={state.errors} className="text-xs text-red-500" />
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="subject" className="text-xs font-bold uppercase text-charcoal/60">Subject</label>
                <input
                  id="subject"
                  type="text"
                  name="_subject"
                  required
                  className="w-full px-4 py-2.5 border border-muted-dark rounded-lg text-sm focus:outline-none focus:border-primary"
                />
                <ValidationError prefix="Subject" field="_subject" errors={state.errors} className="text-xs text-red-500" />
              </div>
              <div className="space-y-1">
                <label htmlFor="message" className="text-xs font-bold uppercase text-charcoal/60">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  className="w-full px-4 py-2.5 border border-muted-dark rounded-lg text-sm focus:outline-none focus:border-primary"
                />
                <ValidationError prefix="Message" field="message" errors={state.errors} className="text-xs text-red-500" />
              </div>
              <button
                type="submit"
                disabled={state.submitting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-full text-xs shadow-glow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{state.submitting ? 'Sending...' : 'Send Message'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Operational Contacts info */}
        <aside className="space-y-6">
          <div className="bg-white border border-muted p-8 rounded-premium shadow-card space-y-6">
            <h3 className="font-extrabold text-charcoal text-lg font-sans">Kitchen Hub</h3>

            <div className="space-y-4 text-xs text-charcoal/80">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <p>TRIMAKI Hub, Linking Road, Bandra West, Mumbai, MH - 400050</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <p>+91 98765 43210 / +91 22 2640 1234</p>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <p>support@trimaki.com / chef@trimaki.com</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
export default Contact;

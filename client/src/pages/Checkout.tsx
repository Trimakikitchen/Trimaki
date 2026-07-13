import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { MapPin, CreditCard, Shield, Truck, AlertTriangle } from 'lucide-react';
import { usePlaceOrderMutation, useVerifyPaymentMutation } from '../hooks/useOrders';
import api from '../services/api';

// Script injector for Razorpay
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const Checkout: React.FC = () => {
  const { items, grandTotal, subtotal, deliveryFee, tax, discount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const placeOrder = usePlaceOrderMutation();
  const verifyPayment = useVerifyPaymentMutation();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    addressLine: '',
    apartment: '',
    landmark: '',
    pincode: '',
    notes: '',
    paymentMethod: '',
  });

  const [error, setError] = useState('');

  // Fetch addresses on start
  useEffect(() => {
    if (user) {
      setAddressLoading(true);
      api.get<any[]>('/addresses')
        .then((data) => {
          setAddresses(data);
          if (data.length > 0) {
            const def = data.find((a) => a.is_default) || data[0];
            setSelectedAddressId(def.id);
          }
        })
        .catch(console.error)
        .finally(() => setAddressLoading(false));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = () => {
    if (step === 1 && (!formData.fullName || !formData.phone || !formData.email)) {
      setError('Please fill in all contact details.');
      return;
    }
    if (step === 2 && !selectedAddressId && (!formData.addressLine || !formData.pincode)) {
      setError('Please select or write a delivery address.');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.paymentMethod) {
      setError('Please select a payment method before placing your order.');
      return;
    }

    let finalAddressId = selectedAddressId;

    try {
      // 1. If user wrote a new address instead of choosing existing, save it first
      if (!selectedAddressId) {
        const newAddr = await api.post<any>('/addresses', {
          label: 'Home',
          addressLine: formData.addressLine,
          apartment: formData.apartment,
          landmark: formData.landmark,
          pincode: formData.pincode,
          latitude: 19.0664, // Mock geocoded lat
          longitude: 72.8223, // Mock geocoded long
        });
        finalAddressId = newAddr.id;
      }

      // 2. Submit order to API
      const response = await placeOrder.mutateAsync({
        addressId: finalAddressId,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      });

      const { order, payment } = response;

      // 3. Handle Online Razorpay Payment flow
      if (formData.paymentMethod !== 'cod' && payment) {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error('Failed to load Razorpay payment SDK.');
        }

        const options = {
          key: 'rzp_test_your_key_id', // Replaced dynamically or falls back to mock
          amount: payment.amount,
          currency: payment.currency,
          name: 'TRIMAKI Sushi',
          description: 'Premium Sushi Delivery',
          order_id: payment.razorpayOrderId,
          handler: async (paymentResponse: any) => {
            // Verify payment signature
            await verifyPayment.mutateAsync({
              orderId: order.id,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              signature: paymentResponse.razorpay_signature || 'mock-valid-signature',
            });
            clearCart();
            navigate(`/track-order?id=${order.id}`);
          },
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: '#FF7A00',
          },
        };

        // Open Razorpay widget
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Cash on delivery path
        clearCart();
        navigate(`/track-order?id=${order.id}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit order.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-16 h-16 text-warning mx-auto" />
        <h2 className="text-2xl font-extrabold text-charcoal font-sans">No items for checkout</h2>
        <button onClick={() => navigate('/menu')} className="px-6 py-2.5 bg-primary text-white font-bold rounded-full">
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-extrabold text-charcoal font-sans mb-10">Secure Checkout</h2>

      {/* Progress Tracker */}
      <div className="flex items-center justify-between max-w-lg mx-auto mb-12">
        {[
          { label: 'Details', num: 1 },
          { label: 'Delivery', num: 2 },
          { label: 'Payment', num: 3 },
        ].map((item) => (
          <div key={item.num} className="flex items-center gap-2">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= item.num ? 'bg-primary text-white' : 'bg-muted-dark text-charcoal/50'
              }`}
            >
              {item.num}
            </span>
            <span className={`text-sm font-semibold ${step >= item.num ? 'text-charcoal' : 'text-charcoal/50'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white border border-muted p-8 rounded-premium shadow-card space-y-6">
            {error && (
              <div className="bg-accent/10 border border-accent/20 text-accent p-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* Step 1: Contact Details */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-extrabold text-charcoal text-lg font-sans">Contact Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-charcoal/60">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-muted-dark rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-charcoal/60">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-muted-dark rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-charcoal/60">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-muted-dark rounded-lg text-sm"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Address Select */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-extrabold text-charcoal text-lg font-sans flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>Choose Delivery Location</span>
                </h3>

                {/* Existing saved addresses */}
                {addresses.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`p-4 border rounded-xl cursor-pointer block hover:bg-muted/30 transition-all ${
                          selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-muted-dark'
                        }`}
                      >
                        <div className="flex gap-2.5 items-start">
                          <input
                            type="radio"
                            name="selectedAddressId"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-1"
                          />
                          <div>
                            <span className="font-bold text-xs uppercase text-primary block">{addr.label}</span>
                            <span className="text-xs text-charcoal/80 leading-relaxed block mt-1">{addr.address_line}</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-muted">
                  <label className="flex items-center gap-2 text-xs font-bold text-charcoal uppercase cursor-pointer">
                    <input
                      type="radio"
                      name="selectedAddressId"
                      checked={selectedAddressId === ''}
                      onChange={() => setSelectedAddressId('')}
                    />
                    <span>Add New Address</span>
                  </label>
                </div>

                {!selectedAddressId && (
                  <div className="space-y-4 animate-fade-in pt-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-charcoal/60">Address Line</label>
                      <input
                        type="text"
                        name="addressLine"
                        value={formData.addressLine}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-muted-dark rounded-lg text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-charcoal/60">Landmark</label>
                        <input
                          type="text"
                          name="landmark"
                          value={formData.landmark}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-muted-dark rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-charcoal/60">Pincode</label>
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-muted-dark rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payments */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-extrabold text-charcoal text-lg font-sans flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span>Choose Payment Method</span>
                </h3>

                <div className="space-y-3">
                  {[
                    { id: 'upi', label: 'UPI (GPay / PhonePe / Paytm)' },
                    { id: 'card', label: 'Credit or Debit Cards' },
                    { id: 'cod', label: 'Cash on Delivery (COD)' },
                  ].map((pay) => (
                    <label
                      key={pay.id}
                      className={`flex items-center gap-4 px-4 py-3.5 border rounded-xl cursor-pointer hover:bg-muted/30 transition-all ${
                        formData.paymentMethod === pay.id ? 'border-primary bg-primary/5' : 'border-muted-dark'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={pay.id}
                        checked={formData.paymentMethod === pay.id}
                        onChange={handleChange}
                        className="text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="text-sm font-semibold text-charcoal">{pay.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Nav controls */}
            <div className="flex justify-between items-center pt-6 border-t border-muted">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-6 py-2.5 border border-muted-dark rounded-full text-sm font-bold text-charcoal hover:bg-muted"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-full hover:bg-primary-hover shadow-glow"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={placeOrder.isPending}
                  className="px-8 py-3 bg-primary text-white font-bold text-sm rounded-full hover:bg-primary-hover shadow-glow disabled:opacity-50"
                >
                  {placeOrder.isPending ? 'Processing...' : `Pay & Place Order (₹${grandTotal.toFixed(2)})`}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Billing aggregates */}
        <aside>
          <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-6">
            <h3 className="font-extrabold text-charcoal text-base font-sans">Order Summary</h3>
            <div className="space-y-4 max-h-60 overflow-y-auto border-b border-muted pb-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between items-start gap-4 text-xs">
                  <div className="flex-grow">
                    <p className="font-bold text-charcoal">{item.product.name}</p>
                    <p className="text-muted-medium">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-charcoal">
                    ₹{((item.product.discountedPrice || item.product.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 text-xs text-charcoal/80 border-b border-muted pb-4">
              <p className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">₹{subtotal}</span>
              </p>
              {discount > 0 && (
                <p className="flex justify-between text-primary font-medium">
                  <span>Discount:</span>
                  <span>-₹{discount}</span>
                </p>
              )}
              <p className="flex justify-between">
                <span>Delivery:</span>
                <span className="font-medium">{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
              </p>
              <p className="flex justify-between">
                <span>GST Tax (5%):</span>
                <span className="font-medium">₹{tax.toFixed(2)}</span>
              </p>
            </div>

            <div className="flex justify-between items-center text-base font-bold text-charcoal">
              <span>Grand Total:</span>
              <span className="text-lg text-primary">₹{grandTotal.toFixed(2)}</span>
            </div>

            <div className="flex gap-2.5 p-3.5 bg-muted/70 rounded-xl text-[10px] text-muted-medium leading-relaxed items-start">
              <Shield className="w-4 h-4 text-primary flex-shrink-0" />
              <p>Your connection is secured with SSL/TLS encryption. All payments processed via Razorpay integration.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
export default Checkout;

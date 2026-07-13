import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Ticket, Percent } from 'lucide-react';

export const Cart: React.FC = () => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    subtotal,
    deliveryFee,
    tax,
    discount,
    grandTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess(false);
    if (!couponCode.trim()) return;

    const ok = await applyCoupon(couponCode);
    if (ok) {
      setCouponSuccess(true);
      setCouponCode('');
    } else {
      setCouponError('Invalid coupon code or minimum order value not met.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary text-4xl">
          🍱
        </div>
        <h2 className="text-3xl font-extrabold text-charcoal font-sans">Your Cart is Empty</h2>
        <p className="text-muted-medium text-sm max-w-sm mx-auto">
          Add some delicious, ultra-fresh premium sushi rolls to your cart to experience luxury dining at home.
        </p>
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-full transition-all shadow-glow"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Browse Our Menu</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-extrabold text-charcoal font-sans mb-10">Your Cart ({items.length} items)</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Side: Cart Items List */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => {
            const price = item.product.discountedPrice || item.product.price;
            return (
              <div
                key={item.product.id}
                className="bg-white border border-muted p-5 rounded-premium shadow-card flex flex-col sm:flex-row items-center gap-6"
              >
                {/* Item Thumbnail */}
                <div className="w-20 h-20 bg-muted border border-muted-dark rounded-xl flex items-center justify-center text-3xl">
                  {item.product.image}
                </div>

                {/* Item Info */}
                <div className="flex-grow space-y-1 text-center sm:text-left">
                  <h3 className="font-bold text-charcoal text-lg font-sans">{item.product.name}</h3>
                  <p className="text-xs text-muted-medium line-clamp-1">{item.product.description}</p>
                  <p className="text-sm font-bold text-primary">₹{price}</p>
                </div>

                {/* Quantity adjustment & delete */}
                <div className="flex items-center gap-6">
                  {/* Quantity adjustment toggler */}
                  <div className="flex items-center border border-muted-dark rounded-full p-1 bg-muted">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1.5 hover:bg-white rounded-full text-charcoal/70 hover:text-primary transition-all"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-charcoal">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1.5 hover:bg-white rounded-full text-charcoal/70 hover:text-primary transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-2 hover:bg-accent/10 rounded-full text-charcoal/40 hover:text-accent transition-all"
                    title="Remove Item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Billing summary & checkout actions */}
        <aside className="space-y-6">
          {/* Coupon Code Panel */}
          <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-4">
            <h3 className="font-extrabold text-charcoal text-base font-sans flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              <span>Have a Promo Coupon?</span>
            </h3>

            {appliedCoupon ? (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Percent className="w-4 h-4" />
                  <span>{appliedCoupon.code} Applied</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-accent hover:underline font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Code: TRIMAKI50"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-grow px-4 py-2 border border-muted-dark rounded-full text-sm uppercase focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-charcoal text-white font-bold text-xs rounded-full hover:bg-primary transition-colors uppercase"
                >
                  Apply
                </button>
              </form>
            )}

            {couponError && <p className="text-xs text-accent font-medium">{couponError}</p>}
            {couponSuccess && <p className="text-xs text-success font-medium">Coupon applied successfully!</p>}
          </div>

          {/* Pricing Details Panel */}
          <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-4">
            <h3 className="font-extrabold text-charcoal text-base font-sans">Payment Summary</h3>
            <div className="space-y-3 text-sm border-b border-muted pb-4">
              <p className="flex justify-between text-charcoal/80">
                <span>Subtotal:</span>
                <span className="font-medium">₹{subtotal}</span>
              </p>
              {discount > 0 && (
                <p className="flex justify-between text-primary font-medium">
                  <span>Coupon Discount:</span>
                  <span>-₹{discount}</span>
                </p>
              )}
              <p className="flex justify-between text-charcoal/80">
                <span>Delivery Charge:</span>
                <span className="font-medium">{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
              </p>
              <p className="flex justify-between text-charcoal/80">
                <span>GST Tax (5%):</span>
                <span className="font-medium">₹{tax.toFixed(2)}</span>
              </p>
            </div>

            <div className="flex justify-between items-center text-lg font-bold text-charcoal">
              <span>Grand Total:</span>
              <span className="text-xl text-primary">₹{grandTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-full transition-all inline-flex items-center justify-center gap-2 shadow-glow hover:scale-[1.02]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
export default Cart;

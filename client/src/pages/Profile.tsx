import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useOrdersQuery } from '../hooks/useOrders';
import { MapPin, ClipboardList, Award, Star, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [showAllModal, setShowAllModal] = useState(false);
  const [feedbackOrder, setFeedbackOrder] = useState<any>(null);
  const [feedbackState, setFeedbackState] = useState<Record<string, { rating: number; comment: string; submitted: boolean; loading: boolean; error: string }>>({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const { data: orders, isLoading } = useOrdersQuery({
    enabled: !!user,
  });

  if (!user) return null;

  const handleOpenFeedback = (order: any) => {
    setFeedbackOrder(order);
    const initial: typeof feedbackState = {};
    order.items.forEach((item: any) => {
      initial[item.productId] = {
        rating: 5,
        comment: '',
        submitted: false,
        loading: false,
        error: '',
      };
    });
    setFeedbackState(initial);
  };

  const handleReorder = (order: any) => {
    if (!order.items) return;
    order.items.forEach((item: any) => {
      const mockProduct: any = {
        id: item.productId,
        name: item.productName,
        price: Number(item.price),
        image: item.productImage || '🍣',
        vegOrNonveg: 'veg',
        categoryId: '',
        slug: '',
        description: '',
        ingredients: [],
        preparationTime: 15,
        spicyLevel: 0,
        bestseller: false,
        featured: false,
        galleryImages: [],
        active: true,
        createdAt: new Date(),
      };
      addToCart(mockProduct, item.quantity);
    });
    navigate('/cart');
  };

  // Top 3 orders to display initially
  const displayedOrders = orders?.slice(0, 3) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 font-sans">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Left Side: Avatar and stats info */}
        <aside className="w-full md:w-80 bg-white border border-muted p-6 rounded-premium shadow-card text-center space-y-4">
          <div className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center font-bold text-primary text-3xl mx-auto">
            {user.fullName.charAt(0)}
          </div>
          <div>
            <h3 className="font-extrabold text-charcoal text-lg font-sans">{user.fullName}</h3>
            <p className="text-xs text-muted-medium">{user.email}</p>
            <p className="text-xs text-muted-medium">{user.phone}</p>
          </div>
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <div>
                <span className="text-[10px] text-muted-medium block uppercase tracking-wide">Loyalty Level</span>
                <span className="text-xs font-bold text-charcoal">Sushi Enthusiast</span>
              </div>
            </div>
            <span className="text-base font-extrabold text-primary">340 Pts</span>
          </div>
        </aside>

        {/* Right Side: Account Actions Tabs */}
        <div className="flex-grow space-y-6">
          {/* Order History Panel */}
          <section className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-4">
            <h3 className="font-extrabold text-charcoal text-base font-sans flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              <span>Order History</span>
            </h3>

            {isLoading ? (
              <div className="space-y-4 py-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : !orders || orders.length === 0 ? (
              <div className="text-center py-8 text-muted-medium space-y-2">
                <span className="text-3xl block">🥢😴</span>
                <p className="text-xs font-medium">You haven't placed any orders yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-muted space-y-4">
                {displayedOrders.map((order, idx) => {
                  const itemsText = order.items
                    ? order.items.map((item: any) => `${item.productName} (x${item.quantity})`).join(', ')
                    : 'No items loaded';
                  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <div key={order.id} className="pt-4 first:pt-0 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-4">
                      <div className="space-y-1">
                        <p className="font-bold text-charcoal">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-muted-medium">{formattedDate}</p>
                        <p className="text-[11px] text-charcoal/80 italic leading-relaxed">{itemsText}</p>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-3">
                        <div className="text-left sm:text-right space-y-1">
                          <p className="font-extrabold text-charcoal">₹{order.total}</p>
                          <span className="inline-block px-2.5 py-0.5 bg-success/10 text-success border border-success/20 font-bold rounded uppercase text-[9px] tracking-wide">
                            {order.orderStatus}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReorder(order)}
                            className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-glow transition-all"
                          >
                            Reorder
                          </button>
                          {order.orderStatus === 'delivered' ? (
                            <button
                              onClick={() => handleOpenFeedback(order)}
                              className="px-3.5 py-2 bg-muted hover:bg-muted-dark text-charcoal font-bold border border-muted-dark rounded-xl transition-all"
                            >
                              Feedback
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate(`/track-order?id=${order.id}`)}
                              className="px-3.5 py-2 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-all"
                            >
                              Track
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Show All Bar */}
                {orders.length > 3 && (
                  <button
                    onClick={() => setShowAllModal(true)}
                    className="w-full mt-4 py-3 bg-muted hover:bg-muted-dark text-charcoal font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all border border-muted-dark"
                  >
                    <span>Show all previous orders ({orders.length})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Saved Addresses Panel */}
          <section className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-4">
            <h3 className="font-extrabold text-charcoal text-base font-sans flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <span>Saved Addresses</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Home', address: 'Apartment 4B, Blue Heights, Linking Road, Bandra West, Mumbai, 400050' },
                { label: 'Office', address: 'TechHub Cubicles, Block G, BKC, Bandra East, Mumbai, 400051' },
              ].map((addr, i) => (
                <div key={i} className="p-4 border border-muted-dark rounded-xl space-y-2">
                  <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold rounded-full uppercase">
                    {addr.label}
                  </span>
                  <p className="text-xs text-charcoal/80 leading-relaxed">{addr.address}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Show All Orders Popup Modal */}
      {showAllModal && orders && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-muted w-full max-w-4xl rounded-premium shadow-card max-h-[85vh] overflow-y-auto flex flex-col font-sans">
            <div className="p-6 border-b border-muted flex justify-between items-center bg-muted/30">
              <div>
                <h3 className="font-extrabold text-charcoal text-lg">Full Order History</h3>
                <p className="text-xs text-muted-medium">View all previous orders placed with TRIMAKI</p>
              </div>
              <button
                onClick={() => setShowAllModal(false)}
                className="text-xs font-bold text-muted-medium hover:text-charcoal transition-colors px-4 py-2 bg-muted border border-muted-dark rounded-full"
              >
                Close
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto divide-y divide-muted space-y-6 flex-grow">
              {orders.map((order) => {
                const itemsText = order.items
                  ? order.items.map((item: any) => `${item.productName} (x${item.quantity})`).join(', ')
                  : 'No items loaded';
                const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div key={order.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="font-bold text-charcoal">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-muted-medium">{formattedDate}</p>
                      <p className="text-[11px] text-charcoal/80 italic leading-relaxed">{itemsText}</p>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-3">
                      <div className="text-left sm:text-right space-y-1">
                        <p className="font-extrabold text-charcoal">₹{order.total}</p>
                        <span className="inline-block px-2.5 py-0.5 bg-success/10 text-success border border-success/20 font-bold rounded uppercase text-[9px] tracking-wide">
                          {order.orderStatus}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReorder(order)}
                          className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-glow transition-all"
                        >
                          Reorder
                        </button>
                        {order.orderStatus === 'delivered' ? (
                          <button
                            onClick={() => handleOpenFeedback(order)}
                            className="px-3.5 py-2 bg-muted hover:bg-muted-dark text-charcoal font-bold border border-muted-dark rounded-xl transition-all"
                          >
                            Feedback
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/track-order?id=${order.id}`)}
                            className="px-3.5 py-2 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-all"
                          >
                            Track
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Popup Modal */}
      {feedbackOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-muted w-full max-w-2xl rounded-premium shadow-card max-h-[85vh] overflow-y-auto flex flex-col font-sans">
            <div className="p-6 border-b border-muted flex justify-between items-center bg-muted/30">
              <div>
                <h3 className="font-extrabold text-charcoal text-lg">Feedback & Rating</h3>
                <p className="text-xs text-muted-medium">Order #{feedbackOrder.id.slice(0, 8)}</p>
              </div>
              <button
                onClick={() => setFeedbackOrder(null)}
                className="text-xs font-bold text-muted-medium hover:text-charcoal transition-colors px-4 py-2 bg-muted border border-muted-dark rounded-full"
              >
                Close
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto divide-y divide-muted space-y-6 flex-grow">
              {feedbackOrder.items && feedbackOrder.items.map((item: any) => {
                const state = feedbackState[item.productId] || { rating: 5, comment: '', submitted: false, loading: false, error: '' };
                return (
                  <div key={item.productId} className="py-6 first:pt-0 last:pb-0 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    <div className="flex gap-4 items-center">
                      <div className="w-14 h-14 bg-muted border border-muted-dark rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                        {item.productImage || '🍣'}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-charcoal">{item.productName}</h4>
                        <span className="text-[10px] text-muted-medium">Quantity: {item.quantity}</span>
                      </div>
                    </div>

                    {state.submitted ? (
                      <div className="bg-success/10 border border-success/20 text-success text-[11px] font-semibold px-4 py-2 rounded-full flex items-center gap-1 shadow-card animate-fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        <span>Submitted!</span>
                      </div>
                    ) : (
                      <div className="w-full md:w-auto flex-grow max-w-sm space-y-2">
                        {/* Stars */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-medium font-bold uppercase mr-1">Rating:</span>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => {
                                setFeedbackState((prev) => ({
                                  ...prev,
                                  [item.productId]: { ...prev[item.productId], rating: star }
                                }));
                              }}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  star <= state.rating ? 'text-warning fill-warning' : 'text-muted-dark'
                                }`}
                              />
                            </button>
                          ))}
                        </div>

                        {/* Comment input */}
                        <div className="flex gap-2 items-center">
                          <textarea
                            placeholder="Add your review..."
                            value={state.comment}
                            onChange={(e) => {
                              setFeedbackState((prev) => ({
                                ...prev,
                                [item.productId]: { ...prev[item.productId], comment: e.target.value }
                              }));
                            }}
                            rows={1}
                            className="flex-grow px-3 py-1.5 border border-muted-dark rounded-xl text-xs focus:outline-none focus:border-primary bg-muted/20"
                          />
                          <button
                            type="button"
                            disabled={state.loading}
                            onClick={() => {
                              const rev = feedbackState[item.productId];
                              if (!rev) return;

                              setFeedbackState((prev) => ({
                                ...prev,
                                [item.productId]: { ...prev[item.productId], loading: true, error: '' }
                              }));

                              api.post('/reviews', {
                                productId: item.productId,
                                rating: rev.rating,
                                comment: rev.comment,
                              })
                              .then(() => {
                                setFeedbackState((prev) => ({
                                  ...prev,
                                  [item.productId]: { ...prev[item.productId], loading: false, submitted: true }
                                }));
                              })
                              .catch((err) => {
                                setFeedbackState((prev) => ({
                                  ...prev,
                                  [item.productId]: { ...prev[item.productId], loading: false, error: err?.message || 'Submission failed.' }
                                }));
                              });
                            }}
                            className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-[11px] font-bold rounded-xl shadow-glow transition-all"
                          >
                            {state.loading ? '...' : 'Submit'}
                          </button>
                        </div>
                        {state.error && (
                          <p className="text-[10px] text-accent font-medium">{state.error}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Profile;

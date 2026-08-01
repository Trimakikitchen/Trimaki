import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, ShieldAlert, Navigation, Star } from 'lucide-react';
import { OrderStatus } from '@shared/types';
import { useOrderByIdQuery, useOrdersQuery } from '../hooks/useOrders';
import { useOrderLocationQuery } from '../hooks/useDelivery';
import api from '../services/api';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Live delivery tracking map — polls partner GPS every 10s
const LiveDeliveryMap: React.FC<{ orderId: string }> = ({ orderId }) => {
  const { data: loc } = useOrderLocationQuery(orderId, true);

  if (!loc || (!loc.deliveryLat && !loc.destLat)) return null;

  const partnerName = loc.partnerName || 'Your delivery partner';

  if (MAPS_API_KEY && loc.deliveryLat && loc.deliveryLng && loc.destLat && loc.destLng) {
    const src = `https://www.google.com/maps/embed/v1/directions?key=${MAPS_API_KEY}&origin=${loc.deliveryLat},${loc.deliveryLng}&destination=${loc.destLat},${loc.destLng}&mode=driving`;
    return (
      <div className="bg-white border border-muted rounded-premium shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-muted flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary animate-pulse" />
            <span className="font-bold text-charcoal text-sm">{partnerName} is on the way</span>
          </div>
          <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">● LIVE</span>
        </div>
        <iframe title="delivery-map" src={src} className="w-full h-64" allowFullScreen loading="lazy" />
      </div>
    );
  }

  // Fallback: show Google Maps link to destination when no API key
  if (loc.destLat && loc.destLng) {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${loc.destLat},${loc.destLng}`;
    return (
      <div className="bg-white border border-muted rounded-premium shadow-card p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Navigation className="w-5 h-5 text-primary animate-pulse" />
          <div>
            <p className="font-bold text-charcoal text-sm">{partnerName} is on the way</p>
            <p className="text-xs text-muted-medium">GPS location updating live</p>
          </div>
        </div>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary-hover transition-colors">
          View Map
        </a>
      </div>
    );
  }

  return null;
};

export const TrackOrder: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id') || '';

  // 1. Fetch all orders (active & historical) for the user
  const { data: allOrders, isLoading: listLoading } = useOrdersQuery({
    refetchInterval: 5000,
  });

  // 2. Fetch the specific order if queried individually
  const { data: singleOrder, isLoading: singleLoading } = useOrderByIdQuery(orderId, {
    enabled: !!orderId,
    refetchInterval: 5000,
  });

  const [reviews, setReviews] = useState<Record<string, { rating: number; comment: string; submitted: boolean; loading: boolean; error: string }>>({});

  // Combine tracked orders:
  // If an orderId is provided, we track it.
  // We also track any other active orders (not delivered and not cancelled).
  // Sort them by createdAt descending (recent first).
  const trackedOrders = React.useMemo(() => {
    const list = new Map<string, any>();
    
    // Add the specific order first if available
    if (singleOrder) {
      list.set(singleOrder.id, singleOrder);
    }
    
    // Add all other active orders
    if (allOrders) {
      allOrders.forEach((o) => {
        if (o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled') {
          list.set(o.id, o);
        }
      });
    }
    
    return Array.from(list.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [allOrders, singleOrder]);

  useEffect(() => {
    if (trackedOrders.length > 0 && Object.keys(reviews).length === 0) {
      const initial: typeof reviews = {};
      trackedOrders.forEach((order) => {
        if (order.items) {
          order.items.forEach((item: any) => {
            initial[item.productId] = {
              rating: 5,
              comment: '',
              submitted: false,
              loading: false,
              error: '',
            };
          });
        }
      });
      setReviews(initial);
    }
  }, [trackedOrders]);

  const handleRatingChange = (productId: string, rating: number) => {
    setReviews((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        rating,
      },
    }));
  };

  const handleCommentChange = (productId: string, comment: string) => {
    setReviews((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        comment,
      },
    }));
  };

  const handleSubmitReview = async (productId: string) => {
    const rev = reviews[productId];
    if (!rev) return;

    setReviews((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], loading: true, error: '' },
    }));

    try {
      await api.post('/reviews', {
        productId,
        rating: rev.rating,
        comment: rev.comment,
      });

      setReviews((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], loading: false, submitted: true },
      }));
    } catch (err: any) {
      setReviews((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], loading: false, error: err?.message || 'Failed to submit review.' },
      }));
    }
  };

  const steps = [
    { label: 'Order Placed', desc: 'We have received your order request.', status: 'received' },
    { label: 'Order Accepted', desc: 'Your order has been accepted by the kitchen.', status: 'accepted' },
    { label: 'In Kitchen', desc: 'Chef is rolling and packing your premium sushi.', status: 'preparing' },
    { label: 'In Transit', desc: 'Rider is en route to your location.', status: 'out_for_delivery' },
    { label: 'Delivered', desc: 'Sushi delivered fresh, enjoy!', status: 'delivered' },
  ];

  const getStepIndex = (current: OrderStatus) => {
    switch (current) {
      case 'received': return 0;
      case 'accepted': return 1;
      case 'preparing':
      case 'packed': return 2;
      case 'out_for_delivery':
      case 'in_transit':
      case 'near_doorstep': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const isLoading = listLoading || (!!orderId && singleLoading);

  if (isLoading && trackedOrders.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 animate-pulse">
        <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto" />
        <p className="text-sm text-muted-medium font-bold">Querying order tracking data...</p>
      </div>
    );
  }

  if (trackedOrders.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 font-sans">
        <ShieldAlert className="w-12 h-12 text-accent mx-auto" />
        <h3 className="text-xl font-bold text-charcoal">No active orders found</h3>
        <p className="text-xs text-muted-medium">There are no pending orders currently being tracked.</p>
        <Link to="/" className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-full inline-block">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-32 space-y-16 font-sans">
      {trackedOrders.map((orderData) => {
        const currentIndex = getStepIndex(orderData.orderStatus);

        return (
          <div key={orderData.id} className="space-y-8 border-b border-muted-dark/50 pb-16 last:border-b-0 last:pb-0">
            {/* Header Card */}
            <div className="bg-white border border-muted p-8 rounded-premium shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="text-xs text-muted-medium block uppercase tracking-wider font-bold">Live Tracking</span>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <h2 className="text-2xl font-extrabold text-charcoal font-sans">Order #{orderData.id.slice(0, 8)}</h2>
                  {orderData.orderStatus === 'cancelled' && (
                    <span className="px-2.5 py-0.5 bg-accent/15 text-accent border border-accent/25 rounded font-black uppercase text-[10px] tracking-wider">
                      Cancelled
                    </span>
                  )}
                  {orderData.orderStatus === 'in_transit' && (
                    <span className="px-2.5 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 rounded font-black uppercase text-[10px] tracking-wider animate-pulse">
                      🛵 In Transit
                    </span>
                  )}
                  {orderData.orderStatus === 'near_doorstep' && (
                    <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 rounded font-black uppercase text-[10px] tracking-wider animate-pulse">
                      📍 Almost Here!
                    </span>
                  )}
                </div>
              </div>
              {orderData.orderStatus !== 'cancelled' && (
                <div className="flex items-center gap-4 bg-muted p-4 rounded-xl border border-muted-dark">
                  <Clock className="w-8 h-8 text-primary animate-pulse" />
                  <div>
                    <span className="text-xs text-muted-medium block">Estimated Arrival</span>
                    <span className="text-lg font-bold text-charcoal">
                      {orderData.orderStatus === 'delivered' ? '0' : '20'} Mins
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Delivery Map — shows when order is out for delivery */}
            {['out_for_delivery', 'in_transit', 'near_doorstep'].includes(orderData.orderStatus) && (
              <LiveDeliveryMap orderId={orderData.id} />
            )}

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-8">
                {/* Cancellation Alert Banner */}
                {orderData.orderStatus === 'cancelled' && (
                  <div className="bg-accent/10 border border-accent/20 rounded-premium p-6 flex items-start gap-4 animate-fade-in text-left">
                    <div className="bg-accent/20 p-2.5 rounded-xl flex items-center justify-center text-accent text-lg flex-shrink-0">⚠️</div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-accent text-sm font-sans">Order Cancelled</h4>
                      <p className="text-xs text-charcoal/80 leading-relaxed">
                        This order was cancelled by the store.
                      </p>
                      {orderData.cancellationReason && (
                        <p className="text-xs text-charcoal font-semibold mt-1">
                          Reason: <span className="italic font-medium text-accent font-sans">"{orderData.cancellationReason}"</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline Card */}
                {orderData.orderStatus !== 'cancelled' && (
                  <div className="bg-white border border-muted p-8 rounded-premium shadow-card space-y-8">
                    <h3 className="font-extrabold text-charcoal text-lg font-sans">Delivery Timeline</h3>

                    <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted-dark">
                      {steps.map((step, idx) => {
                        const isCompleted = idx < currentIndex;
                        const isActive = idx === currentIndex;
                        return (
                          <div key={idx} className="relative flex gap-6 items-start">
                            <span
                              className={`absolute -left-8 w-7 h-7 rounded-full flex items-center justify-center border-2 z-10 transition-colors ${
                                isCompleted
                                  ? 'bg-success border-success text-white'
                                  : isActive
                                  ? 'bg-white border-primary text-primary'
                                  : 'bg-white border-muted-dark text-charcoal/30'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 fill-success text-white" />
                              ) : (
                                <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-primary' : 'bg-charcoal/30'}`} />
                              )}
                            </span>

                            <div>
                              <h4 className={`font-bold text-sm font-sans ${isActive ? 'text-primary' : 'text-charcoal'}`}>
                                {step.label}
                              </h4>
                              <p className="text-xs text-muted-medium mt-0.5">{step.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Rate & Review Card */}
                {orderData.orderStatus === 'delivered' && orderData.items && orderData.items.length > 0 && (
                  <div className="bg-white border border-muted p-8 rounded-premium shadow-card space-y-6">
                    <h3 className="font-extrabold text-charcoal text-lg font-sans">Rate & Review Your Meal</h3>
                    <div className="divide-y divide-muted">
                      {orderData.items.map((item: any) => {
                        const rev = reviews[item.productId] || { rating: 5, comment: '', submitted: false, loading: false, error: '' };
                        return (
                          <div key={item.productId} className="py-6 first:pt-0 last:pb-0 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                            <div className="flex gap-4 items-center">
                              <div className="w-16 h-16 bg-muted border border-muted-dark rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                                {item.productImage || '🍣'}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-charcoal">{item.productName}</h4>
                                <span className="text-[10px] text-muted-medium">Quantity: {item.quantity}</span>
                              </div>
                            </div>

                            {rev.submitted ? (
                              <div className="bg-success/10 border border-success/20 text-success text-xs font-semibold px-4 py-2.5 rounded-full flex items-center gap-1.5 animate-fade-in">
                                <CheckCircle2 className="w-4 h-4 text-success" />
                                <span>Review submitted, thank you!</span>
                              </div>
                            ) : (
                              <div className="w-full md:w-auto flex-grow max-w-md space-y-3">
                                {/* Stars */}
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-medium mr-2 font-bold uppercase tracking-wide">Rating:</span>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => handleRatingChange(item.productId, star)}
                                      className="focus:outline-none"
                                    >
                                      <Star
                                        className={`w-5 h-5 ${
                                          star <= rev.rating
                                            ? 'text-warning fill-warning'
                                            : 'text-muted-dark'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>

                                {/* Comment input */}
                                <div className="flex gap-2 items-center">
                                  <textarea
                                    placeholder="Write a comment (optional)..."
                                    value={rev.comment}
                                    onChange={(e) => handleCommentChange(item.productId, e.target.value)}
                                    rows={3}
                                    className="flex-grow px-3.5 py-2 border border-muted-dark rounded-xl text-xs focus:outline-none focus:border-primary bg-muted/20 font-sans resize-none"
                                  />
                                  <button
                                    type="button"
                                    disabled={rev.loading}
                                    onClick={() => handleSubmitReview(item.productId)}
                                    className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-glow transition-all disabled:opacity-50 flex-shrink-0"
                                  >
                                    {rev.loading ? 'Submitting...' : 'Submit'}
                                  </button>
                                </div>
                                {rev.error && (
                                  <p className="text-[10px] text-accent font-medium mt-1">{rev.error}</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Controls */}
              <aside className="space-y-6">
                <div className="bg-white border border-muted p-6 rounded-premium shadow-card space-y-4">
                  <h3 className="font-extrabold text-charcoal text-base font-sans">Route Preview</h3>
                  <div className="w-full h-56 bg-muted border border-muted-dark rounded-xl flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
                    <Navigation className="w-8 h-8 text-primary animate-bounce mb-2" />
                    <p className="text-sm font-bold text-charcoal font-sans">Google Maps Tracker</p>
                    <p className="text-xs text-muted-medium">Delivery details coordinates geolocated dynamically.</p>
                  </div>

                  {orderData.otp && orderData.orderStatus !== 'delivered' && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center space-y-1">
                      <span className="text-xs text-muted-medium block">Provide OTP on Handover</span>
                      <span className="text-2xl font-extrabold tracking-widest text-primary font-sans">
                        {orderData.otp}
                      </span>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default TrackOrder;

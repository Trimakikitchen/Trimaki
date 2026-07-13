import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight, Star, Award, ShieldCheck, Flame } from 'lucide-react';
import { useCategoriesQuery, useProductsQuery } from '../hooks/useProducts';
import { useOrdersQuery } from '../hooks/useOrders';
import { useAuth } from '../context/AuthContext';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const { data: categories, isLoading: catsLoading } = useCategoriesQuery();
  const { data: bestSellers, isLoading: prodsLoading } = useProductsQuery({ bestseller: true });

  const { data: orders } = useOrdersQuery({
    refetchInterval: 5000,
    enabled: !!user,
  });

  const activeOrders = orders?.filter(
    (o) => o.userId === user?.id && o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled'
  ) || [];

  const getDisplayStatus = (status: string) => {
    switch (status) {
      case 'received': return 'Order Placed';
      case 'accepted': return 'Order Accepted';
      case 'preparing':
      case 'packed': return 'In Kitchen';
      case 'out_for_delivery': return 'In Transit';
      default: return status;
    }
  };

  React.useEffect(() => {
    document.title = 'TRIMAKI — Premium Japanese Sushi Delivered Fresh';
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {user && activeOrders.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 -mb-12">
          <div className="bg-white border border-primary/20 p-5 rounded-premium flex flex-col md:flex-row justify-between items-center gap-4 shadow-premium relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-50"></div>
            <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse flex-shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-muted-medium uppercase font-bold tracking-wider block">Active Order Status</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-bold text-charcoal font-sans">Order #{activeOrders[0].id.slice(0, 8)}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[9px] font-black uppercase tracking-wider">
                    {getDisplayStatus(activeOrders[0].orderStatus)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end relative z-10">
              <span className="text-xs text-muted-medium">
                Estimated arrival: <span className="text-charcoal font-extrabold">{activeOrders[0].orderStatus === 'out_for_delivery' ? '10 Mins' : '25 Mins'}</span>
              </span>
              <Link
                to={`/track-order?id=${activeOrders[0].id}`}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1 shadow-glow"
              >
                <span>Track Order</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
      {/* Hero Section */}
      <section className="relative min-h-[85vh] bg-charcoal overflow-hidden flex items-center">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#FF7A00_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-white max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                🍣 Premium Japanese Sushi
              </span>
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] font-sans">
                Experience <span className="text-gradient">Pure Luxury</span> in Every Bite.
              </h1>
              <p className="text-muted-medium text-lg leading-relaxed">
                Handcrafted sushi made with premium, freshly flown-in ingredients. Delivered raw, chilled, and perfect to your table.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/menu"
                  className="px-8 py-4 bg-primary text-white font-semibold rounded-full shadow-glow hover:bg-primary-hover hover:scale-105 transition-all inline-flex items-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Order Now</span>
                </Link>
              </div>
            </div>

            <div className="relative flex justify-center items-center">
              <div className="w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] rounded-full border border-primary/20 bg-charcoal-light flex items-center justify-center p-6 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10"></div>
                <div className="text-center space-y-4">
                  <span className="text-6xl sm:text-7xl block">🍱</span>
                  <p className="text-lg font-bold text-white font-sans tracking-wide">TRIMAKI SIGNATURE BENTO</p>
                  <p className="text-xs text-muted-medium max-w-[200px] mx-auto">California rolls, premium Salmon Nigiri, & classic Maki combo.</p>
                  <div className="inline-block px-3.5 py-1 bg-primary text-white text-xs font-extrabold rounded-full">₹1,299 ONLY</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-charcoal font-sans">Popular Categories</h2>
          <p className="text-muted-medium text-sm mt-2">Pick from our premium collection of authentic sushi creations</p>
        </div>
        {catsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white rounded-premium border border-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories?.map((cat) => (
              <Link
                to={`/menu?category=${cat.slug}`}
                key={cat.id}
                className="bg-white border border-muted hover:border-primary/30 p-6 rounded-premium text-center shadow-card hover:shadow-premium hover:-translate-y-1 transition-all group"
              >
                <span className="text-4xl block mb-4 group-hover:scale-110 transition-transform">🍣</span>
                <h3 className="font-bold text-charcoal text-base font-sans">{cat.name}</h3>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Best Sellers Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white py-16 rounded-premium border border-muted shadow-card">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-extrabold text-charcoal font-sans">Bestselling Sushi</h2>
            <p className="text-muted-medium text-sm mt-2">Loved by our patrons. Order fresh, order now.</p>
          </div>
          <Link to="/menu" className="text-primary hover:text-primary-hover font-semibold text-sm flex items-center gap-1">
            <span>View All Menu</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {prodsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-muted/30 border border-muted rounded-premium animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {bestSellers?.slice(0, 3).map((prod) => (
              <div
                key={prod.id}
                className="bg-muted/50 border border-muted p-5 rounded-premium flex flex-col justify-between hover:shadow-premium transition-all relative"
              >
                {prod.spicyLevel > 0 && (
                  <span className="absolute top-4 left-4 bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <Flame className="w-3 h-3 fill-accent" />
                    <span>Spicy</span>
                  </span>
                )}
                <div className="w-full h-44 bg-muted border border-muted-dark rounded-xl flex items-center justify-center text-4xl mb-4">
                  🍣
                </div>
                <div className="space-y-2 flex-grow">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      prod.vegOrNonveg === 'veg' ? 'bg-success/10 text-success border border-success/20' : 'bg-accent/10 text-accent border border-accent/20'
                    }`}>
                      {prod.vegOrNonveg}
                    </span>
                    <div className="flex items-center text-warning text-xs font-bold gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-warning" />
                      <span>{prod.rating || 4.8}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-charcoal font-sans">{prod.name}</h3>
                  <p className="text-xs text-muted-medium line-clamp-2">{prod.description}</p>
                </div>
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-muted-dark">
                  <div>
                    <span className="text-xs text-muted-medium block">Price</span>
                    <span className="text-lg font-bold text-charcoal">₹{prod.price}</span>
                  </div>
                  <Link
                    to="/menu"
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Why Choose Us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-charcoal font-sans">Why Choose TRIMAKI?</h2>
          <p className="text-muted-medium text-sm mt-2">Elevating the cloud kitchen experience with standard luxury guidelines</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Authentic Fresh Ingredients',
              desc: 'Salmon and sushi grade fish flown in daily. No preservatives, completely fresh.',
              icon: Award,
            },
            {
              title: 'Cold-Chain Delivery Logistics',
              desc: 'Specialized cooling containers ensure raw elements stay at absolute optimum temperatures.',
              icon: ShieldCheck,
            },
            {
              title: 'Hygienic Clean Kitchens',
              desc: 'State of the art automated kitchens following international clean-room guidelines.',
              icon: ShieldCheck,
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="p-8 bg-white border border-muted rounded-premium shadow-card space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-charcoal font-sans">{item.title}</h3>
                <p className="text-xs text-muted-medium leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-charcoal text-white rounded-premium p-10 sm:p-16 text-center space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"></div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-sans">Receive Exclusive Offers</h2>
          <p className="text-muted-medium text-sm max-w-md mx-auto">
            Subscribe to get latest menu updates, special discounts, and curated chef experiences directly in your inbox.
          </p>
          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 pt-4">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-grow px-5 py-3 rounded-full bg-charcoal-light border border-white/10 text-white placeholder-muted-medium focus:outline-none focus:border-primary text-sm"
            />
            <button className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-full transition-all text-sm whitespace-nowrap shadow-glow">
              Subscribe Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
export default Home;

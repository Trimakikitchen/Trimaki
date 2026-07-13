import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useCategoriesQuery, useProductsQuery } from '../hooks/useProducts';
import { Search, Flame, Star, ShoppingBag, SlidersHorizontal } from 'lucide-react';

export const Menu: React.FC = () => {
  const { addToCart } = useCart();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high'>('popular');

  React.useEffect(() => {
    document.title = 'Menu — TRIMAKI Premium Sushi';
  }, []);

  const { data: categories, isLoading: catsLoading } = useCategoriesQuery();
  const { data: products, isLoading: prodsLoading } = useProductsQuery({
    search: search.trim() || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    veg: vegFilter,
    sortBy,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-premium border border-muted shadow-card">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search our premium sushi menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-5 py-3 rounded-full bg-muted border border-muted-dark focus:outline-none focus:border-primary text-sm"
          />
          <Search className="w-5 h-5 text-muted-medium absolute left-4 top-3.5" />
        </div>

        {/* Sorting and Filters Options */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="inline-flex rounded-full border border-muted-dark bg-muted p-1 text-xs">
            <button
              onClick={() => setVegFilter('all')}
              className={`px-4 py-1.5 rounded-full font-bold transition-all ${
                vegFilter === 'all' ? 'bg-primary text-white shadow-card' : 'text-charcoal/70'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setVegFilter('veg')}
              className={`px-4 py-1.5 rounded-full font-bold transition-all ${
                vegFilter === 'veg' ? 'bg-success text-white shadow-card' : 'text-charcoal/70'
              }`}
            >
              Veg
            </button>
            <button
              onClick={() => setVegFilter('non-veg')}
              className={`px-4 py-1.5 rounded-full font-bold transition-all ${
                vegFilter === 'non-veg' ? 'bg-accent text-white shadow-card' : 'text-charcoal/70'
              }`}
            >
              Non-Veg
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-4 py-2.5 bg-muted border border-muted-dark rounded-full text-xs font-bold focus:outline-none"
          >
            <option value="popular">Popularity</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Main Catalog Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side: Category Filter Panel */}
        <aside className="space-y-6">
          <div className="bg-white p-6 rounded-premium border border-muted shadow-card">
            <h3 className="font-extrabold text-charcoal text-base font-sans mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <span>Categories</span>
            </h3>
            {catsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`flex justify-between items-center px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                    selectedCategory === 'all'
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-charcoal/80 hover:bg-muted'
                  }`}
                >
                  <span>All Creations</span>
                </button>
                {categories?.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.slug)}
                    className={`flex justify-between items-center px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                      selectedCategory === category.slug
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-charcoal/80 hover:bg-muted'
                    }`}
                  >
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right Side: Product Catalog Grid */}
        <div className="lg:col-span-3">
          {prodsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-white border border-muted rounded-premium animate-pulse" />
              ))}
            </div>
          ) : !products || products.length === 0 ? (
            <div className="bg-white text-center py-20 rounded-premium border border-muted shadow-card space-y-4">
              <span className="text-5xl block">🍣🔍</span>
              <h3 className="text-xl font-bold text-charcoal font-sans">No products match your filters</h3>
              <p className="text-muted-medium text-xs">Try adjusting your keywords or active menu categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white border border-muted p-5 rounded-premium flex flex-col justify-between hover:shadow-premium hover:-translate-y-1 transition-all relative group"
                >
                  {prod.bestseller && (
                    <span className="absolute top-4 left-4 bg-primary text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-card z-10 uppercase tracking-wider">
                      Bestseller
                    </span>
                  )}
                  <div className="w-full h-44 bg-muted border border-muted-dark rounded-xl flex items-center justify-center text-4xl mb-4 group-hover:scale-105 transition-transform">
                    {prod.image}
                  </div>
                  <div className="space-y-2 flex-grow">
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded ${
                        prod.vegOrNonveg === 'veg' ? 'bg-success/10 text-success border border-success/20' : 'bg-accent/10 text-accent border border-accent/20'
                      }`}>
                        {prod.vegOrNonveg}
                      </span>
                      <div className="flex items-center text-warning text-xs font-bold gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-warning" />
                        <span>{prod.rating || 4.8}</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-base text-charcoal font-sans">{prod.name}</h3>
                    <p className="text-xs text-muted-medium line-clamp-2">{prod.description}</p>
                    {prod.spicyLevel > 0 && (
                      <div className="flex items-center gap-0.5 text-accent">
                        {Array.from({ length: prod.spicyLevel }).map((_, idx) => (
                          <Flame key={idx} className="w-3.5 h-3.5 fill-accent" />
                        ))}
                        <span className="text-[10px] font-bold uppercase ml-1">Spicy Level {prod.spicyLevel}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-muted">
                    <div>
                      {prod.discountedPrice ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-medium line-through">₹{prod.price}</span>
                          <span className="text-base font-bold text-primary">₹{prod.discountedPrice}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-medium">Price</span>
                          <span className="text-base font-bold text-charcoal">₹{prod.price}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(prod, 1)}
                      className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-glow"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Menu;

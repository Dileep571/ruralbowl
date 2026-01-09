'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { productsAPI } from '@/lib/api';
import { Search, Grid3x3, Filter, Package, TrendingUp, Heart } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import { ButtonSpinner } from '@/components/LoadingSpinner';
import { ProductGridSkeleton } from '@/components/Skeletons';
import api from '@/lib/authApi';
import AuthRequiredModal from '@/components/AuthRequiredModal';

// Fallback simple card if ProductCard component is unavailable
function SimpleProductCard({ product, onWishlistAuthRequired }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If product has variants, redirect to product page to select variant
    if (product.has_variants) {
      window.location.href = `/products/${product.slug}`;
      return;
    }
    
    // Check stock
    if (product.stock_quantity !== undefined && product.stock_quantity <= 0) {
      return;
    }
    
    setAdding(true);
    await addToCart(product, 1);
    setAdding(false);
  };
  
  // Check if out of stock
  // For products with variants, don't show out of stock badge (user needs to select variant)
  // Only show out of stock for regular products
  const isOutOfStock = !product.has_variants && product.stock_quantity !== undefined && product.stock_quantity <= 0;
  
  // Handle products with variants that have price_range
  const displayPrice = product.has_variants && product.price_range 
    ? product.price_range.min_price 
    : (product.price || 0);
  
  const maxPrice = product.has_variants && product.price_range 
    ? product.price_range.max_price 
    : null;
  
  const showPriceRange = product.has_variants && maxPrice && displayPrice !== maxPrice;
  
  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!api.isAuthenticated()) {
      onWishlistAuthRequired(product.slug);
      return;
    }
    
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await api.removeFromWishlist(product.id);
        setInWishlist(false);
      } else {
        await api.addToWishlist(product.id);
        setInWishlist(true);
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      const errorMsg = error?.message || '';
      if (errorMsg.toLowerCase().includes('already in wishlist')) {
        setInWishlist(true);
      }
    } finally {
      setWishlistLoading(false);
    }
  };
  
  // Fix image URL - handle external URLs (Cloudinary) and local paths
  const imageUrl = product.image_url 
    ? (product.image_url.startsWith('http://') || product.image_url.startsWith('https://') 
        ? product.image_url 
        : (product.image_url.startsWith('/') ? product.image_url : `/images/${product.image_url}`))
    : '/images/placeholder.png';
  
  return (
    <div className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
      <Link href={`/products/${product.slug}`}>
        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
          {/* Skeleton loader */}
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gray-200"></div>
          )}
          
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={imageUrl} 
            alt={product.name} 
            loading="lazy"
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => { e.target.src = '/images/placeholder.png'; }}
          />
          
          {/* Out of Stock Badge */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-xl">
                OUT OF STOCK
              </div>
            </div>
          )}
          
          {/* Discount Badge */}
          {!isOutOfStock && product.original_price > displayPrice && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 text-xs font-bold rounded-lg shadow-lg">
              {Math.round((1 - displayPrice / product.original_price) * 100)}% OFF
            </div>
          )}
          
          {/* Low Stock Warning */}
          {!isOutOfStock && product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity <= 5 && (
            <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1.5 text-xs font-bold rounded-lg shadow-lg">
              Only {product.stock_quantity} left
            </div>
          )}
          
          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            disabled={wishlistLoading}
            className="absolute bottom-3 right-3 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-lg transition-all hover:scale-110 disabled:opacity-50 z-10"
          >
            <Heart 
              className={`w-5 h-5 transition-colors ${inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        <div className="p-3 sm:p-4">
          <h3 className="text-sm md:text-base font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[2rem] sm:min-h-[2.5rem] group-hover:text-green-600 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-1.5 mb-1">
            <p className="text-[0.7rem] sm:text-base md:text-lg font-bold text-green-600">
              {showPriceRange 
                ? `₹${Number(displayPrice).toFixed(2)} - ₹${Number(maxPrice).toFixed(2)}`
                : `₹${Number(displayPrice).toFixed(2)}`
              }
            </p>
            <span className="text-[0.65rem] sm:text-xs text-gray-500 whitespace-nowrap">/{product.unit || 'kg'}</span>
          </div>
          {product.original_price > displayPrice && (
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs text-gray-400 line-through">₹{Number(product.original_price).toFixed(2)}</p>
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">
                {Math.round((1 - displayPrice / product.original_price) * 100)}% OFF
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500">
            {product.has_variants ? 'Multiple sizes available' : `${product.unit_value || '1'} ${product.unit || 'kg'}`}
          </p>
        </div>
      </Link>
      
      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        <button 
          onClick={handleAddToCart}
          disabled={adding || isOutOfStock}
          className={`w-full py-2 sm:py-2.5 rounded-lg transition-all duration-300 text-xs sm:text-sm font-medium flex items-center justify-center shadow-md hover:shadow-lg group-hover:scale-[1.02] ${
            isOutOfStock 
              ? 'bg-gray-400 cursor-not-allowed text-white' 
              : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 disabled:opacity-60 disabled:cursor-not-allowed'
          }`}>
          {adding ? (
            <>
              <ButtonSpinner className="text-white mr-1.5 sm:mr-2" />
              <span>Adding...</span>
            </>
          ) : isOutOfStock ? (
            <span>Out of Stock</span>
          ) : product.has_variants ? (
            <>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="truncate">Select Options</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="truncate">Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || 'all';
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [search, setSearch] = useState(urlSearchQuery);
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalProduct, setAuthModalProduct] = useState('');

  // Update search state when URL search parameter changes
  useEffect(() => {
    setSearch(urlSearchQuery);
  }, [urlSearchQuery]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [cats, prods] = await Promise.all([
          productsAPI.getCategories().catch(() => []),
          productsAPI.getAll().catch(() => []),
        ]);
        if (!isMounted) return;
        const categoriesArray = Array.isArray(cats) ? cats : [];
        const productsArray = Array.isArray(prods) ? prods : [];
        setCategories([{ id: 'all', name: 'All', slug: 'all' }, ...categoriesArray]);
        setProducts(productsArray);
        
        // Calculate max price from products
        const prices = productsArray.map(p => parseFloat(p.price || 0));
        const max = Math.ceil(Math.max(...prices, 1000));
        setMaxPrice(max);
        setPriceRange([0, max]);
        
        // Set selected category based on URL parameter
        if (urlCategory && urlCategory !== 'all') {
          const matchingCat = categoriesArray.find(c => c.slug === urlCategory || c.id === urlCategory);
          if (matchingCat) {
            setSelectedCategoryId(matchingCat.id);
          } else {
            setSelectedCategoryId(urlCategory);
          }
        }
      } catch (e) {
        if (!isMounted) return;
        setError('Failed to load products. Please try again later.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [urlCategory]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const cat = selectedCategoryId;
    let result = (products || []).filter(p => {
      const matchesSearch = term ? (p.name || '').toLowerCase().includes(term) : true;
      const matchesCategory = cat === 'all' ? true : (
        p.category_id === cat ||
        p.category === cat ||
        (p.category && (p.category.id === cat || p.category.slug === cat)) ||
        (typeof cat === 'number' && (p.category_id === Number(cat))) ||
        (p.category_slug === cat)
      );
      const price = parseFloat(p.price || 0);
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      return matchesSearch && matchesCategory && matchesPrice;
    });
    
    // Sort products
    if (sortBy === 'price-low') {
      result = result.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
    } else if (sortBy === 'price-high') {
      result = result.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
    } else if (sortBy === 'name') {
      result = result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'newest') {
      result = result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
    
    return result;
  }, [products, search, selectedCategoryId, priceRange, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <Package className="w-8 h-8" />
            <h1 className="text-3xl sm:text-4xl font-bold">Our Products</h1>
          </div>
          <p className="text-green-50 text-lg">Discover farm-fresh produce delivered straight from farmers to your doorstep</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Stats Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-900">{filtered.length}</span>
                <span>Products Available</span>
              </div>
            </div>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="mb-8 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filter by Category</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    selectedCategoryId === cat.id 
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/30 scale-105' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-green-300 hover:scale-105'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sort and Price Filter */}
          {/* <div className="bg-white rounded-xl shadow-md p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={maxPrice}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                  <button
                    onClick={() => setPriceRange([0, maxPrice])}
                    className="text-xs text-green-600 hover:text-green-700 font-medium whitespace-nowrap"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div> */}
        </div>

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        ) : filtered.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((p) => (
              <SimpleProductCard 
                key={p.id} 
                product={p} 
                onWishlistAuthRequired={(slug) => {
                  setAuthModalProduct(slug);
                  setShowAuthModal(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-32">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <Grid3x3 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => { setSearch(''); setSelectedCategoryId('all'); setPriceRange([0, maxPrice]); }}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectTo={`/products/${authModalProduct}`}
        title="Sign In to Save to Wishlist"
        message="Create an account or log in to save items to your wishlist and access them from any device."
        footerNote={null}
      />
    </div>
  );
}
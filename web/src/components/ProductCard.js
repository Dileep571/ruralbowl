'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from './CartProvider';
import { ButtonSpinner } from './LoadingSpinner';
import api from '../lib/authApi';
import { useToast } from './ToastProvider';
import AuthRequiredModal from './AuthRequiredModal';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    checkWishlistStatus();
  }, [product.id]);

  const checkWishlistStatus = async () => {
    if (!api.isAuthenticated()) return;
    try {
      const data = await api.getWishlist();
      const isInWishlist = data.items?.some(item => item.product_id === product.id);
      setInWishlist(isInWishlist);
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!api.isAuthenticated()) {
      setShowAuthModal(true);
      return;
    }

    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await api.removeFromWishlist(product.id);
        setInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await api.addToWishlist(product.id);
        setInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      const errorMsg = error?.message || '';
      if (errorMsg.toLowerCase().includes('already in wishlist')) {
        setInWishlist(true);
        toast.info('Product is already in your wishlist');
      } else {
        toast.error('Failed to update wishlist');
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If product has variants, redirect to product page to select variant
    if (product.has_variants) {
      window.location.href = `/products/${product.slug}`;
      return;
    }
    
    setAdding(true);
    await addToCart(product, 1);
    setAdding(false);
  };

  // Calculate price display for variants
  const getPriceDisplay = () => {
    if (product.has_variants && product.price_range) {
      const { min_price, max_price } = product.price_range;
      if (min_price === max_price) {
        return `₹${parseFloat(min_price).toFixed(2)}`;
      }
      return `₹${parseFloat(min_price).toFixed(2)} - ₹${parseFloat(max_price).toFixed(2)}`;
    }
    return `₹${parseFloat(product.price || 0).toFixed(2)}`;
  };

  // Fix image URL handling
  const getImageUrl = () => {
    if (!product.image_url) return '/images/placeholder.png';
    // Handle external URLs (Cloudinary, etc.)
    if (product.image_url.startsWith('http://') || product.image_url.startsWith('https://')) {
      return product.image_url;
    }
    // Handle relative and absolute paths
    return product.image_url.startsWith('/') ? product.image_url : `/images/${product.image_url}`;
  };

  const discount = product.originalPrice > product.price 
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <>
      <div className="product-card group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 relative">
        <Link href={`/products/${product.slug}`}>
        <div className="relative overflow-hidden bg-gray-50">
          <div className="aspect-square w-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={getImageUrl()} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => { e.target.src = '/images/placeholder.png'; }}
            />
          </div>
          {discount > 0 && (
            <span className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 text-xs font-bold rounded-lg shadow-lg">
              {discount}% OFF
            </span>
          )}
          {/* Wishlist Button */}
          <button
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            className={`absolute top-3 left-3 p-2 rounded-full bg-white shadow-lg hover:scale-110 transition-all z-10 ${
              inWishlist ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            } disabled:opacity-50`}
          >
            <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
          </button>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <div className="p-3 sm:p-4">
          <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 group-hover:text-green-600 transition-colors line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
            {product.name}
          </h3>
          
          <div className="mb-3 sm:mb-4">
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-[0.7rem] sm:text-base md:text-lg font-bold text-green-600">{getPriceDisplay()}</span>
              <span className="text-[0.65rem] sm:text-xs text-gray-500 whitespace-nowrap">/{product.unit || 'kg'}</span>
            </div>
            {(product.original_price && product.original_price > product.price) && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs sm:text-sm text-gray-400 line-through">₹{parseFloat(product.original_price).toFixed(2)}</span>
                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">
                  {Math.round((1 - product.price / product.original_price) * 100)}% OFF
                </span>
              </div>
            )}
            <span className="text-xs text-gray-500 block mt-1">
              {product.has_variants ? 'Multiple sizes available' : `${product.unit_value || '1'} ${product.unit || 'kg'}`}
            </span>
          </div>
        </div>
        </Link>
      
        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        <button 
          onClick={handleAddToCart}
          disabled={adding}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 sm:py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 text-xs sm:text-sm font-medium flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg group-hover:scale-[1.02]">
          {adding ? (
            <>
              <ButtonSpinner className="text-white mr-1.5 sm:mr-2" />
              <span>Adding...</span>
            </>
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
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectTo={`/products/${product.slug}`}
        title="Sign In to Save to Wishlist"
        message="Create an account or log in to save items to your wishlist and access them from any device."
        footerNote={null}
      />
    </>
  );
}
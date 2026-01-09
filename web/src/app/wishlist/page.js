'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2, Package } from 'lucide-react';
import api from '@/lib/authApi';
import { useCart } from '@/components/CartProvider';
import { ButtonSpinner } from '@/components/LoadingSpinner';
import { useRouter } from 'next/navigation';

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingToCart, setMovingToCart] = useState({});
  const [removing, setRemoving] = useState({});
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await api.getWishlist();
      // API returns { wishlist: [...] }
      setWishlist(response.wishlist || []);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToCart = async (item) => {
    try {
      setMovingToCart(prev => ({ ...prev, [item.wishlist_id]: true }));
      
      // Add to cart
      await addToCart(item, 1);
      
      // Remove from wishlist
      await api.removeFromWishlist(item.wishlist_id);
      
      // Update local state
      setWishlist(prev => prev.filter(w => w.wishlist_id !== item.wishlist_id));
    } catch (error) {
      console.error('Failed to move to cart:', error);
    } finally {
      setMovingToCart(prev => ({ ...prev, [item.wishlist_id]: false }));
    }
  };

  const handleRemove = async (itemId) => {
    try {
      setRemoving(prev => ({ ...prev, [itemId]: true }));
      await api.removeFromWishlist(itemId);
      setWishlist(prev => prev.filter(w => w.wishlist_id !== itemId));
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    } finally {
      setRemoving(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '/images/placeholder.png';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    return imageUrl.startsWith('/') ? imageUrl : `/images/${imageUrl}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <Heart className="w-8 h-8 fill-current" />
            <h1 className="text-3xl sm:text-4xl font-bold">My Wishlist</h1>
          </div>
          <p className="text-pink-50 text-lg">
            {wishlist.length > 0 
              ? `You have ${wishlist.length} ${wishlist.length === 1 ? 'item' : 'items'} in your wishlist`
              : 'Your wishlist is empty'
            }
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {wishlist.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Heart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">Save your favorite products to your wishlist!</p>
            <Link 
              href="/products" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg text-sm sm:text-base"
            >
              <Package className="w-5 h-5" />
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map(item => {
              const product = item.product || item;
              
              // Skip if product data is missing
              if (!product) return null;
              
              const displayPrice = product.has_variants && product.price_range 
                ? product.price_range.min_price 
                : (product.price || 0);
              
              // For products with variants, don't show out of stock badge (user needs to select variant)
              const isOutOfStock = !product.has_variants && product.stock_quantity !== undefined && product.stock_quantity <= 0;

              return (
                <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                  <Link href={`/products/${product.slug}`}>
                    <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={getImageUrl(product.image_url)} 
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                      />
                      
                      {/* Out of Stock Overlay */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-xl">
                            OUT OF STOCK
                          </div>
                        </div>
                      )}
                      
                      {/* Discount Badge */}
                      {!isOutOfStock && product.original_price > displayPrice && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 text-xs font-bold rounded-lg shadow-lg">
                          {Math.round((1 - displayPrice / product.original_price) * 100)}% OFF
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem] group-hover:text-green-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-baseline gap-2 mb-1">
                        <p className="text-lg font-bold text-green-600">
                          ₹{Number(displayPrice).toFixed(2)}
                        </p>
                        <span className="text-xs text-gray-500">/{product.unit || 'kg'}</span>
                      </div>
                      {product.original_price > displayPrice && (
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-xs text-gray-400 line-through">₹{Number(product.original_price).toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="px-4 pb-4 space-y-2">
                    {/* Move to Cart Button */}
                    <button 
                      onClick={() => handleMoveToCart(item)}
                      disabled={movingToCart[item.wishlist_id] || isOutOfStock}
                      className={`w-full py-2.5 rounded-lg transition-all duration-300 font-medium flex items-center justify-center shadow-md hover:shadow-lg ${
                        isOutOfStock
                          ? 'bg-gray-400 cursor-not-allowed text-white'
                          : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 disabled:opacity-60'
                      }`}
                    >
                      {movingToCart[item.wishlist_id] ? (
                        <>
                          <ButtonSpinner className="text-white mr-2" />
                          Moving...
                        </>
                      ) : isOutOfStock ? (
                        'Out of Stock'
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Move to Cart
                        </>
                      )}
                    </button>
                    
                    {/* Remove Button */}
                    <button 
                      onClick={() => handleRemove(item.wishlist_id)}
                      disabled={removing[item.wishlist_id]}
                      className="w-full bg-red-50 text-red-600 py-2.5 rounded-lg hover:bg-red-100 transition-all duration-300 font-medium flex items-center justify-center disabled:opacity-60"
                    >
                      {removing[item.wishlist_id] ? (
                        <>
                          <ButtonSpinner className="text-red-600 mr-2" />
                          Removing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

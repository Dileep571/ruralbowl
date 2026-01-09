'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ToastProvider';
import api from '@/lib/authApi';
import { SectionLoader, LoadingButton } from '@/components/LoadingSpinner';
import { Heart } from 'lucide-react';
import AuthRequiredModal from '@/components/AuthRequiredModal';

export default function CartPage() {
  const router = useRouter();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const { cart: items, loading, updateQuantity: updateQty, removeFromCart, clearCart: clearCartFn, getCartTotal } = useCart();
  const [updatingId, setUpdatingId] = useState(null);
  const [wishlistLoading, setWishlistLoading] = useState({});
  const [removeModal, setRemoveModal] = useState({ open: false, item: null });
  const [showAuthModal, setShowAuthModal] = useState(false);

  const subtotal = useMemo(() => {
    return (items || []).reduce((sum, it) => {
      const price = it?.product?.price ?? it?.price ?? 0;
      const qty = it?.quantity ?? 0;
      return sum + price * qty;
    }, 0);
  }, [items]);

  const updateQuantity = async (item, nextQty) => {
    if (!item?.id) return;
    const qty = Math.max(0, Number(nextQty) || 0);
    setUpdatingId(item.id);
    await updateQty(item.id, qty);
    setUpdatingId(null);
  };

  const removeItem = async (item) => {
    if (!item?.id) return;
    setUpdatingId(item.id);
    await removeFromCart(item.id);
    setUpdatingId(null);
    setRemoveModal({ open: false, item: null });
  };
  
  const openRemoveModal = (item) => {
    setRemoveModal({ open: true, item });
  };
  
  const moveToWishlist = async (item) => {
    if (!api.isAuthenticated()) {
      toast.warning('Please login to add to wishlist');
      return;
    }
    
    // Get product ID from item - check multiple possible locations
    const productId = item.product_id || item.product?.id || item.id;
    
    if (!productId) {
      toast.error('Unable to identify product');
      return;
    }
    
    setWishlistLoading(prev => ({ ...prev, [item.id]: true }));
    try {
      await api.addToWishlist(productId);
      await removeFromCart(item.id);
      toast.success('Moved to wishlist!');
      setRemoveModal({ open: false, item: null });
    } catch (error) {
      console.error('Move to wishlist error:', error);
      const errorMsg = error?.message || '';
      if (errorMsg.toLowerCase().includes('already in wishlist')) {
        // Product already in wishlist, just remove from cart
        await removeFromCart(item.id);
        toast.info('Product was already in wishlist. Removed from cart.');
        setRemoveModal({ open: false, item: null });
      } else {
        toast.error('Failed to move to wishlist');
      }
    } finally {
      setWishlistLoading(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const clearCart = async () => {
    if (!items.length) return;
    await clearCartFn();
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    router.push('/checkout');
  };

  const deliveryCharge = subtotal > 500 ? 0 : 50;
  const totalAmount = subtotal + deliveryCharge;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Your Cart</h1>

      {loading && <div className="text-gray-600">Loading your cart…</div>}

      {!loading && items.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some fresh farm products to your cart!</p>
          <Link href="/products" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-5 py-2.5 text-sm rounded-lg font-semibold shadow-md shadow-primary-500/25 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/35 hover:scale-105 active:scale-95">
            Shop Products
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Items ({items.length})</h2>
              <button onClick={clearCart} className="text-red-600 hover:text-red-700 text-sm">
                Clear Cart
              </button>
            </div>

            {items.map((item) => {
              const product = item.product || {};
              const name = product.name || item.name || 'Product';
              const price = product.price ?? item.price ?? 0;
              const imageUrl = product.image_url || item.image_url || '/images/placeholder.jpg';
              const unit = product.unit || item.unit || 'unit';
              const isUpdating = updatingId === item.id;

              return (
                <div key={item.id} className="bg-white p-4 rounded-lg shadow border">
                  <div className="flex gap-3 sm:gap-4">
                    <img src={imageUrl} alt={name} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{name}</h3>
                      <p className="text-green-600 font-bold text-sm sm:text-base">₹{price}/{unit}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item, item.quantity - 1)}
                            disabled={isUpdating}
                            className="w-7 h-7 sm:w-8 sm:h-8 border rounded hover:bg-gray-100 disabled:opacity-50 text-sm"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm sm:text-base">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item, item.quantity + 1)}
                            disabled={isUpdating}
                            className="w-7 h-7 sm:w-8 sm:h-8 border rounded hover:bg-gray-100 disabled:opacity-50 text-sm"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => openRemoveModal(item)}
                          disabled={isUpdating}
                          className="text-red-600 hover:text-red-700 text-xs sm:text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-bold text-sm sm:text-base whitespace-nowrap">₹{(price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow border sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className={deliveryCharge === 0 ? 'text-green-600' : ''}>
                    {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                  </span>
                </div>
                {subtotal < 500 && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    Add ₹{(500 - subtotal).toFixed(2)} more for free delivery!
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={!items.length}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Item Modal */}
      {removeModal.open && removeModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Remove Item</h3>
            <p className="text-gray-600 mb-6">
              What would you like to do with "{removeModal.item.product?.name || removeModal.item.name}"?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => moveToWishlist(removeModal.item)}
                disabled={wishlistLoading[removeModal.item.id]}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4" />
                {wishlistLoading[removeModal.item.id] ? 'Moving...' : 'Move to Wishlist'}
              </button>
              <button
                onClick={() => removeItem(removeModal.item)}
                disabled={updatingId === removeModal.item.id}
                className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50"
              >
                {updatingId === removeModal.item.id ? 'Removing...' : 'Remove from Cart'}
              </button>
              <button
                onClick={() => setRemoveModal({ open: false, item: null })}
                className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Required Modal */}
      <AuthRequiredModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        redirectTo="/checkout"
      />
    </div>
  );
}

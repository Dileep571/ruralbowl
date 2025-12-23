'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import { useToast } from '@/components/ToastProvider';
import { SectionLoader, LoadingButton } from '@/components/LoadingSpinner';

export default function CartPage() {
  const router = useRouter();
  const toast = useToast();
  const { cart: items, loading, updateQuantity: updateQty, removeFromCart, clearCart: clearCartFn, getCartTotal } = useCart();
  const [updatingId, setUpdatingId] = useState(null);

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
  };

  const clearCart = async () => {
    if (!items.length) return;
    await clearCartFn();
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
                  <div className="flex gap-4">
                    <img src={imageUrl} alt={name} className="w-20 h-20 object-cover rounded" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{name}</h3>
                      <p className="text-green-600 font-bold">₹{price}/{unit}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item, item.quantity - 1)}
                          disabled={isUpdating}
                          className="w-8 h-8 border rounded hover:bg-gray-100 disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item, item.quantity + 1)}
                          disabled={isUpdating}
                          className="w-8 h-8 border rounded hover:bg-gray-100 disabled:opacity-50"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item)}
                          disabled={isUpdating}
                          className="ml-auto text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{(price * item.quantity).toFixed(2)}</p>
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
                onClick={() => router.push('/checkout')}
                disabled={!items.length}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, cartAPI, ordersAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { SectionLoader, LoadingButton } from '@/components/LoadingSpinner';
import { validators } from '@/utils/validation';

export default function CheckoutPage() {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Prefill address from user if available
    const user = authAPI.getCurrentUser?.() || null;
    if (user?.address) setAddress(user.address);

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await cartAPI.get();
        const arr = Array.isArray(data) ? data : (data.items || []);
        setItems(arr);
        if (!arr.length) {
          toast.info('Your cart is empty. Redirecting to products...');
          setTimeout(() => router.push('/products'), 1500);
        }
      } catch (e) {
        const msg = (e?.message || '').toLowerCase();
        if (msg.includes('unauthorized')) {
          toast.error('Please log in to continue.');
          router.push('/auth/login');
        } else {
          const errorMsg = 'Failed to load your cart for checkout.';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router, toast]);

  const subtotal = useMemo(() => {
    return (items || []).reduce((sum, it) => {
      const price = it?.product?.price ?? it?.price ?? 0;
      const qty = it?.quantity ?? 0;
      return sum + price * qty;
    }, 0);
  }, [items]);

  const submitOrder = async (e) => {
    e.preventDefault();
    if (!items.length) return;
    if (!address.trim()) {
      setError('Please provide a delivery address.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const data = await ordersAPI.create({
        shipping_address: address,
        payment_method: paymentMethod,
        notes: notes || undefined,
      });
      // Try to extract order id if provided
      const orderId = data?.order?.id || data?.id || null;
      // Optionally clear local cart UI; server should clear upon order creation
      router.push(orderId ? `/checkout/success?orderId=${orderId}` : '/checkout/success');
    } catch (e) {
      setError(e?.message || 'Failed to place the order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-gray-600">Loading checkoutâ€¦</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Checkout</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={submitOrder} className="lg:col-span-2 space-y-5">
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Delivery Address</h2>
            <textarea
              rows={4}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter your delivery address"
            />
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Payment Method</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <span>Cash on Delivery</span>
              </label>
              <label className="flex items-center gap-2 opacity-60 cursor-not-allowed">
                <input
                  type="radio"
                  name="payment"
                  value="online"
                  disabled
                />
                <span>Online payment (coming soon)</span>
              </label>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Order Notes</h2>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Any delivery instructions?"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !items.length}
            className="inline-flex items-center px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Placing orderâ€¦' : 'Place Order'}
          </button>
        </form>

        <div className="lg:col-span-1">
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
            <div className="space-y-3 max-h-72 overflow-auto pr-2">
              {items.map((it) => {
                const prod = it.product || it;
                const title = prod?.name || 'Product';
                const price = prod?.price ?? 0;
                return (
                  <div key={it.id} className="flex justify-between text-sm text-gray-700">
                    <span className="truncate mr-2">{title} Ã— {it.quantity}</span>
                    <span>â‚¹{Number(price * (it.quantity ?? 0)).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
            <hr className="my-3" />
            <div className="flex justify-between text-sm text-gray-700">
              <span>Subtotal</span>
              <span>â‚¹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>Delivery</span>
              <span>Calculated at delivery</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 mt-2">
              <span>Total</span>
              <span>â‚¹{subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

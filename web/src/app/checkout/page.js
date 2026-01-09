'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, ordersAPI, deliveryAPI } from '@/lib/api';
import { useCart } from '@/components/CartProvider';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ToastProvider';
import { SectionLoader, LoadingButton } from '@/components/LoadingSpinner';
import { validators } from '@/utils/validation';

export default function CheckoutPage() {
  const router = useRouter();
  const toast = useToast();
  const { cart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [addressData, setAddressData] = useState({
    houseNo: '',
    street: '',
    landmark: '',
    pincode: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deliveryAreas, setDeliveryAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState(null);

  useEffect(() => {
    // Guard: Redirect to cart if not authenticated (direct URL access)
    if (!isAuthenticated) {
      router.push('/cart');
      return;
    }

    // Prefill phone from user if available
    const user = authAPI.getCurrentUser?.() || null;
    if (user?.phone) setAddressData(prev => ({ ...prev, phone: user.phone }));

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const areasData = await deliveryAPI.getAreas();
        setDeliveryAreas(areasData || []);
        
        // Check if cart is empty
        if (!cart || cart.length === 0) {
          toast.info('Your cart is empty. Redirecting to products...');
          setTimeout(() => router.push('/products'), 1500);
        }
      } catch (e) {
        const errorMsg = 'Failed to load checkout data.';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router, toast, isAuthenticated, cart]);

  // Calculate delivery date when area is selected
  useEffect(() => {
    const checkDelivery = async () => {
      if (selectedArea) {
        try {
          const info = await deliveryAPI.checkAvailability(selectedArea);
          setDeliveryInfo(info);
        } catch (e) {
          console.error('Failed to check delivery:', e);
        }
      } else {
        setDeliveryInfo(null);
      }
    };
    checkDelivery();
  }, [selectedArea]);

  const subtotal = useMemo(() => {
    return (cart || []).reduce((sum, it) => {
      const price = it?.product?.price ?? it?.price ?? 0;
      const qty = it?.quantity ?? 0;
      return sum + price * qty;
    }, 0);
  }, [cart]);

  const submitOrder = async (e) => {
    e.preventDefault();
    if (!cart || !cart.length) {
      toast.error('Your cart is empty');
      return;
    }
    
    if (!selectedArea) {
      setError('Please select a delivery area.');
      toast.error('Please select a delivery area');
      return;
    }
    
    // Validate address fields
    const { houseNo, street, pincode, phone } = addressData;
    if (!houseNo.trim() || !street.trim() || !pincode.trim() || !phone.trim()) {
      setError('Please fill in all required address fields.');
      toast.error('Please complete your delivery address');
      return;
    }
    
    if (!/^\d{6}$/.test(pincode)) {
      setError('Please enter a valid 6-digit pincode.');
      toast.error('Invalid pincode format');
      return;
    }
    
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number.');
      toast.error('Invalid phone number');
      return;
    }
    
    // Construct full address
    const fullAddress = `${houseNo}, ${street}${addressData.landmark ? ', ' + addressData.landmark : ''}, ${deliveryAreas.find(a => a.id == selectedArea)?.area_name}, ${deliveryAreas.find(a => a.id == selectedArea)?.city} - ${pincode}`;
    
    setSubmitting(true);
    setError('');
    try {
      const data = await ordersAPI.create({
        shipping_address: fullAddress,
        payment_method: paymentMethod,
        notes: notes || undefined,
        delivery_area_id: parseInt(selectedArea),
        phone: addressData.phone,
      });
      
      const orderId = data?.order?.id || data?.id || null;
      
      // Redirect to success page immediately (cart will be cleared there)
      router.push(orderId ? `/checkout/success?orderId=${orderId}` : '/checkout/success');
    } catch (e) {
      const errorMsg = e?.message || 'Failed to place the order.';
      setError(errorMsg);
      toast.error(errorMsg);
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
          {/* Delivery Area Selection */}
          <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-green-50">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Delivery Area *
            </h2>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">Select your delivery area</option>
              {deliveryAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.area_name}, {area.city}
                </option>
              ))}
            </select>
            
            {deliveryInfo && deliveryInfo.available && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Delivery Available</p>
                    <p className="text-sm text-gray-600 mt-1">Expected Delivery: <strong>{new Date(deliveryInfo.expectedDelivery).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
                    <p className="text-xs text-gray-500 mt-1">{deliveryInfo.deliveryMessage}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Address Section */}
          <div className="border rounded-lg p-4 sm:p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Delivery Address
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="houseNo" className="block text-sm font-medium text-gray-700 mb-1">
                  House/Flat/Building No *
                </label>
                <input
                  id="houseNo"
                  type="text"
                  required
                  value={addressData.houseNo}
                  onChange={(e) => setAddressData(prev => ({ ...prev, houseNo: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="E.g., Flat 101, Building A"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                  Street/Area/Locality *
                </label>
                <input
                  id="street"
                  type="text"
                  required
                  value={addressData.street}
                  onChange={(e) => setAddressData(prev => ({ ...prev, street: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="E.g., MG Road, Sector 12"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="landmark" className="block text-sm font-medium text-gray-700 mb-1">
                  Landmark <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  id="landmark"
                  type="text"
                  value={addressData.landmark}
                  onChange={(e) => setAddressData(prev => ({ ...prev, landmark: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="E.g., Near City Hospital"
                />
              </div>
              
              <div>
                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode *
                </label>
                <input
                  id="pincode"
                  type="text"
                  required
                  maxLength="6"
                  value={addressData.pincode}
                  onChange={(e) => setAddressData(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '') }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="E.g., 517001"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  maxLength="10"
                  value={addressData.phone}
                  onChange={(e) => setAddressData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="E.g., 9876543210"
                />
              </div>
              
              {selectedArea && (
                <div className="sm:col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Delivery to:</span>{' '}
                    {deliveryAreas.find(a => a.id == selectedArea)?.area_name}, {deliveryAreas.find(a => a.id == selectedArea)?.city}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Additional Notes</h2>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Any special instructions for delivery? (Optional)"
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
            disabled={submitting || !cart || !cart.length}
            className="inline-flex items-center px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base"
          >
            {submitting ? 'Placing order…' : 'Place Order'}
          </button>
        </form>

        {/* Sticky Order Summary */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 border rounded-lg p-4 bg-white shadow-md">
            <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
            <div className="space-y-3 max-h-72 overflow-auto pr-2">
              {(cart || []).map((it) => {
                const prod = it.product || it;
                const title = prod?.name || 'Product';
                const price = prod?.price ?? 0;
                return (
                  <div key={it.id} className="flex justify-between text-sm text-gray-700">
                    <span className="truncate mr-2">{title} × {it.quantity}</span>
                    <span>₹{Number(price * (it.quantity ?? 0)).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
            <hr className="my-3" />
            <div className="flex justify-between text-sm text-gray-700">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>Delivery</span>
              <span>Calculated at delivery</span>
            </div>
            {deliveryInfo && (
              <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                <p className="text-green-700 font-medium">Estimated Delivery</p>
                <p className="text-gray-600">{deliveryInfo.estimated_delivery_date}</p>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 mt-3 pt-3 border-t">
              <span className="text-lg">Total</span>
              <span className="text-lg">₹{subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

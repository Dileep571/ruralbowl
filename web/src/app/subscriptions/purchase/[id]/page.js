'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { dashboardAPI } from '@/lib/api';
import { FullPageLoader, LoadingButton } from '@/components/LoadingSpinner';
import { useToast } from '@/components/ToastProvider';
import { isAuthenticated } from '@/lib/auth';

export default function SubscriptionPurchase() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id;
  const toast = useToast();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [activationDate, setActivationDate] = useState('');
  const [deliveryFrequency, setDeliveryFrequency] = useState('weekly');
  const [timeSlot, setTimeSlot] = useState('10am-12pm');
  const [useWallet, setUseWallet] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    loadPlanDetails();
  }, [planId]);

  const loadPlanDetails = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getSubscriptionPlans();
      const plans = Array.isArray(data) ? data : (data.plans || []);
      const selectedPlan = plans.find(p => p.id.toString() === planId);
      
      if (!selectedPlan) {
        setError('Plan not found');
        return;
      }
      
      setPlan(selectedPlan);
      
      // Set default activation date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setActivationDate(tomorrow.toISOString().split('T')[0]);
    } catch (err) {
      console.error('Error loading plan:', err);
      setError('Failed to load plan details');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    
    if (!activationDate) {
      setError('Please select activation date');
      return;
    }

    setPurchasing(true);
    setError('');

    try {
      const purchaseData = {
        plan_id: parseInt(planId),
        activation_date: activationDate,
        delivery_frequency: deliveryFrequency,
        time_slot: timeSlot,
        use_wallet: useWallet,
        payment_id: 'DEMO_PAYMENT_' + Date.now(), // In production, integrate real payment gateway
      };
      
      // Use the subscribe endpoint with full purchase data
      const response = await dashboardAPI.subscribe(planId, purchaseData);
      
      toast.success('Subscription purchased successfully! 🎉');
      setTimeout(() => {
        router.push('/dashboard/calendar');
      }, 1000);
    } catch (err) {
      console.error('Purchase error:', err);
      setError(err.message || 'Failed to purchase subscription. Please try again.');
      toast.error(err.message || 'Failed to purchase subscription');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return <FullPageLoader message="Loading plan details..." />;
  }

  if (error && !plan) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-red-600 text-xl">{error}</div>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Subscribe to {plan?.name}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Plan Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Plan Details</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">{plan?.name}</h3>
              <p className="text-gray-600 text-sm">{plan?.description}</p>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold">{plan?.validity_days} days</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Deliveries:</span>
                <span className="font-semibold">{plan?.total_deliveries} deliveries</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Frequency:</span>
                <span className="font-semibold">{plan?.delivery_frequency}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Included Items:</h4>
              <div className="flex flex-wrap gap-2">
                {(plan?.items || []).map((item, index) => (
                  <span key={index} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
                    {item.name || item} - {item.quantity || '1kg'}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-2xl font-bold text-green-600">
                <span>Total:</span>
                <span>₹{plan?.price}</span>
              </div>
              {plan?.discount_percentage > 0 && (
                <p className="text-sm text-gray-600 text-right">
                  {plan.discount_percentage}% discount applied
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Purchase Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Subscription Details</h2>

          <form onSubmit={handlePurchase} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={activationDate}
                onChange={(e) => setActivationDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                When should your first delivery arrive?
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Frequency
              </label>
              <select
                value={deliveryFrequency}
                onChange={(e) => setDeliveryFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time Slot
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="6am-9am">6 AM - 9 AM</option>
                <option value="9am-12pm">9 AM - 12 PM</option>
                <option value="12pm-3pm">12 PM - 3 PM</option>
                <option value="3pm-6pm">3 PM - 6 PM</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="useWallet"
                checked={useWallet}
                onChange={(e) => setUseWallet(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="useWallet" className="ml-2 block text-sm text-gray-700">
                Use wallet balance (if available)
              </label>
            </div>

            <div className="border-t pt-4 space-y-3">
              <LoadingButton
                type="submit"
                loading={purchasing}
                disabled={purchasing}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200"
              >
                {purchasing ? 'Processing...' : 'Complete Purchase'}
              </LoadingButton>

              <button
                type="button"
                onClick={() => router.back()}
                disabled={purchasing}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition duration-200"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              By subscribing, you agree to our terms and conditions. You can skip, pause, or cancel anytime.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

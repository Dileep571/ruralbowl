'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ButtonSpinner } from './LoadingSpinner';
import { useToast } from './ToastProvider';
import { isAuthenticated } from '@/lib/auth';

export default function SubscriptionPlanCard({ plan }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = () => {
    // Don't allow subscription if plan is coming soon
    if (plan.coming_soon) {
      toast.info('This plan is coming soon! Stay tuned for updates.');
      return;
    }

    if (!isAuthenticated()) {
      toast.warning('Please login to subscribe to this plan');
      router.push('/auth/login');
      return;
    }
    
    setLoading(true);
    // Navigate to subscription purchase page
    router.push(`/subscriptions/purchase/${plan.id}`);
  };

  const discount = plan.originalPrice > plan.price 
    ? Math.round((1 - plan.price / plan.originalPrice) * 100)
    : 0;

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
      plan.popular ? 'ring-2 ring-green-500 relative scale-105' : ''
    }`}>
      {plan.popular && (
        <div className="absolute top-0 right-0 left-0">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-2 font-semibold text-sm">
            ⭐ Most Popular
          </div>
        </div>
      )}
      
      <div className={`p-6 ${plan.popular ? 'pt-12' : ''}`}>
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          <p className="text-gray-600 text-sm">{plan.description}</p>
        </div>

        {/* Price */}
        <div className="text-center mb-6 p-6 bg-gradient-to-br from-gray-50 to-green-50 rounded-xl">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-4xl font-bold text-green-600">₹{plan.price}</span>
            {discount > 0 && (
              <div className="flex flex-col items-start">
                <span className="text-lg text-gray-400 line-through">₹{plan.originalPrice}</span>
                <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-0.5 rounded text-xs font-bold">
                  Save {discount}%
                </span>
              </div>
            )}
          </div>
          <p className="text-gray-600 text-sm font-medium">for {plan.duration}</p>
        </div>

        {/* Delivery Info */}
        {(plan.total_deliveries || plan.deliveries) && (
          <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Total Deliveries:
              </span>
              <span className="font-bold text-gray-900">{plan.total_deliveries || plan.deliveries}</span>
            </div>
            {plan.delivery_frequency && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Frequency:
                </span>
                <span className="font-bold text-gray-900 capitalize">{plan.delivery_frequency}</span>
              </div>
            )}
          </div>
        )}

        {/* Items Included */}
        {plan.items && plan.items.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Items included:</h4>
            <ul className="space-y-2">
              {plan.items.map((item, index) => (
                <li key={index} className="flex items-start text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Subscribe Button */}
        <button
          onClick={handleSubscribe}
          disabled={loading || plan.coming_soon}
          className={`w-full py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
            plan.coming_soon
              ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
              : plan.popular 
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800' 
                : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-900 hover:to-black'
          }`}
        >
          {loading ? (
            <ButtonSpinner className="text-white" />
          ) : plan.coming_soon ? (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Coming Soon
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Subscribe Now
            </>
          )}
        </button>

        {/* Additional Info */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            ✅ Free delivery • 🔄 Skip anytime • 🎯 Customizable
          </p>
        </div>
      </div>
    </div>
  );
}
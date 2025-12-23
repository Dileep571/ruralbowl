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
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:shadow-xl hover:scale-105 ${
      plan.popular ? 'ring-2 ring-green-500 relative' : ''
    }`}>
      {plan.popular && (
        <div className="absolute top-4 right-4">
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="p-6">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
          <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-3xl font-bold text-green-600">₹{plan.price}</span>
            {discount > 0 && (
              <>
                <span className="text-lg text-gray-500 line-through">₹{plan.originalPrice}</span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-medium">
                  {discount}% OFF
                </span>
              </>
            )}
          </div>
          <p className="text-gray-600 text-sm mt-1">for {plan.duration}</p>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">What's included:</h4>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Vegetable Items */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-2">Sample Vegetables:</h4>
          <div className="flex flex-wrap gap-2">
            {plan.items.map((item, index) => (
              <span key={index} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Subscribe Button */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <ButtonSpinner className="text-white" />
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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
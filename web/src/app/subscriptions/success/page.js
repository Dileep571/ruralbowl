'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Calendar, Package, ArrowRight } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const planName = searchParams.get('plan') || 'Subscription Plan';
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Subscription Successful! 🎉
          </h1>
          
          <p className="text-lg text-gray-600 mb-2">
            You've successfully subscribed to
          </p>
          <p className="text-2xl font-bold text-green-600 mb-8">
            {planName}
          </p>

          {/* Info Box */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 mb-8 text-left">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              What's Next?
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-sm font-bold flex-shrink-0">1</span>
                <span>Your subscription is now active and your first delivery has been scheduled</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-sm font-bold flex-shrink-0">2</span>
                <span>Check your delivery calendar to view upcoming deliveries</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-sm font-bold flex-shrink-0">3</span>
                <span>You can reschedule or skip deliveries anytime from your calendar</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-sm font-bold flex-shrink-0">4</span>
                <span>Fresh farm products will be delivered to your doorstep as scheduled</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard/calendar"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 text-sm sm:text-base"
            >
              <Calendar className="w-5 h-5" />
              View Delivery Calendar
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-white text-green-600 border-2 border-green-600 rounded-xl hover:bg-green-50 transition-all duration-300 font-semibold text-sm sm:text-base"
            >
              Go to Dashboard
            </Link>
          </div>

          {/* Additional Links */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Need help?</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/contact" className="text-green-600 hover:text-green-700 font-medium">
                Contact Support
              </Link>
              <span className="text-gray-300">•</span>
              <Link href="/products" className="text-green-600 hover:text-green-700 font-medium">
                Browse Products
              </Link>
              <span className="text-gray-300">•</span>
              <Link href="/dashboard/orders" className="text-green-600 hover:text-green-700 font-medium">
                View Orders
              </Link>
            </div>
          </div>
        </div>

        {/* Confirmation Email Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            📧 A confirmation email has been sent to your registered email address
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

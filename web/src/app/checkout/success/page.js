'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border rounded-2xl shadow-sm p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">✔️</div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Order placed successfully!</h1>
        {orderId ? (
          <p className="mt-2 text-gray-600">Your order ID is <span className="font-medium">#{orderId}</span>.</p>
        ) : (
          <p className="mt-2 text-gray-600">Thanks for your purchase! We'll start preparing your order shortly.</p>
        )}
        
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p>📦 We're preparing your fresh items</p>
            <p>🚚 Quality check & packaging</p>
            <p>🏠 Delivery within 24 hours</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <Link href="/dashboard/orders" className="inline-flex items-center px-4 py-2 rounded-lg border border-green-600 text-green-700 hover:bg-green-50">View orders</Link>
          <Link href="/products" className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
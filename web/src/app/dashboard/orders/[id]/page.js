'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ordersAPI } from '@/lib/api';

function StatusBadge({ status }) {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded border ${map[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>{status || 'unknown'}</span>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const data = await ordersAPI.getById(id);
        if (!isMounted) return;
        setOrder(data.order || data);
        setItems(data.items || data.order?.items || []);
      } catch (e) {
        if (!isMounted) return;
        const msg = (e?.message || '').toLowerCase();
        if (msg.includes('unauthorized')) {
          router.push('/auth/login');
        } else {
          setError('Failed to load order.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [id, router]);

  if (loading) return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-gray-600">Loading order…</div>;
  if (error) return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>;
  if (!order) return null;

  const total = order.total_amount ?? order.total ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
        <Link href="/dashboard/orders" className="text-sm text-green-700 hover:text-green-800">← Back to orders</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-3">Status <StatusBadge status={(order.status || '').toLowerCase()} /></h2>
            <div className="text-sm text-gray-700 space-y-1">
              <p><span className="font-medium">Placed:</span> {new Date(order.created_at).toLocaleString()}</p>
              {order.shipping_address && <p><span className="font-medium">Shipping Address:</span> {order.shipping_address}</p>}
              {order.payment_method && <p><span className="font-medium">Payment:</span> {(order.payment_method || '').toUpperCase()}</p>}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Items</h2>
            <div className="divide-y">
              {items.map(it => {
                const prod = it.product || it;
                const title = prod?.name || 'Product';
                const price = it?.price ?? prod?.price ?? 0;
                const img = prod?.image_url || it?.image_url || '/images/placeholder.png';
                return (
                  <div key={it.id} className="py-3 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={title} className="w-16 h-16 object-cover rounded" onError={(e) => { e.target.src = '/images/placeholder.png'; }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{title}</p>
                      <p className="text-xs text-gray-600">Qty: {it.quantity} × ₹{Number(price).toFixed(2)}</p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">₹{Number(price * (it.quantity ?? 0)).toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Summary</h2>
            <div className="flex justify-between text-sm text-gray-700">
              <span>Subtotal</span>
              <span>₹{Number(total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>Delivery</span>
              <span>Included / TBD</span>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between font-semibold text-gray-900">
              <span>Total</span>
              <span>₹{Number(total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

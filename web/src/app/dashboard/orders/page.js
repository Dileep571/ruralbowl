'use client';
import { useEffect, useState, useMemo } from 'react';
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

export default function OrdersDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await ordersAPI.getAll();
        if (!isMounted) return;
        setOrders(Array.isArray(data) ? data : (data.orders || []));
      } catch (e) {
        if (!isMounted) return;
        const msg = (e?.message || '').toLowerCase();
        if (msg.includes('unauthorized')) {
          setError('Please log in to view your orders.');
        } else {
          setError('Failed to load orders.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter(o => (o.status || '').toLowerCase() === filter);
  }, [orders, filter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">My Orders</h1>
        <div className="flex flex-wrap gap-2">
          {['all','pending','processing','shipped','delivered','cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium border capitalize ${filter === st ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'}`}
            >{st}</button>
          ))}
        </div>
      </div>

      {loading && <div className="text-gray-600">Loading orders…</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

      {!loading && !error && (
        filteredOrders.length ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto border rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Order</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Placed</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Items</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Total</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Expected Delivery</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Status</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => {
                    const orderTotal = o.total_amount ?? o.total ?? 0;
                    const deliveryDate = o.expected_delivery_date ? new Date(o.expected_delivery_date) : null;
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const isTomorrow = deliveryDate && deliveryDate.toDateString() === tomorrow.toDateString();
                    
                    return (
                      <tr key={o.id} className="border-b last:border-0">
                        <td className="px-4 py-2 font-medium text-gray-900">#{o.id}</td>
                        <td className="px-4 py-2 text-gray-600">{new Date(o.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-gray-600">{Array.isArray(o.items) ? o.items.length : (o.item_count ?? '-')}</td>
                        <td className="px-4 py-2 text-gray-900 font-semibold">₹{Number(orderTotal).toFixed(2)}</td>
                        <td className="px-4 py-2">
                          {deliveryDate ? (
                            <div className="text-sm">
                              <div className={`font-medium ${isTomorrow ? 'text-green-700' : 'text-blue-700'}`}>
                                {isTomorrow ? '🚚 Tomorrow' : '📅 ' + deliveryDate.toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {deliveryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2"><StatusBadge status={(o.status || '').toLowerCase()} /></td>
                        <td className="px-4 py-2">
                          <Link href={`/dashboard/orders/${o.id}`} className="text-green-700 hover:text-green-800 text-xs font-medium">View →</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredOrders.map(o => {
                const orderTotal = o.total_amount ?? o.total ?? 0;
                const deliveryDate = o.expected_delivery_date ? new Date(o.expected_delivery_date) : null;
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const isTomorrow = deliveryDate && deliveryDate.toDateString() === tomorrow.toDateString();
                
                return (
                  <div key={o.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Order #{o.id}</p>
                        <p className="text-xs text-gray-600 mt-1">{new Date(o.created_at).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={(o.status || '').toLowerCase()} />
                    </div>
                    {deliveryDate && (
                      <div className={`mb-3 px-3 py-2 rounded-lg ${isTomorrow ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                        <p className="text-xs text-gray-600">Expected Delivery</p>
                        <p className={`text-sm font-semibold ${isTomorrow ? 'text-green-700' : 'text-blue-700'}`}>
                          {isTomorrow ? '🚚 Tomorrow' : '📅 ' + deliveryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-gray-600">{Array.isArray(o.items) ? o.items.length : (o.item_count ?? '-')} items</span>
                      <span className="text-gray-900 font-semibold text-base">₹{Number(orderTotal).toFixed(2)}</span>
                    </div>
                    <Link 
                      href={`/dashboard/orders/${o.id}`} 
                      className="block w-full text-center py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-gray-600">No orders found.</div>
        )
      )}
    </div>
  );
}

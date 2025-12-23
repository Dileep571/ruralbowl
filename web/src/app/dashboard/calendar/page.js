'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dashboardAPI } from '@/lib/api';

function StatusBadge({ status }) {
  const map = {
    scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
    confirmed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    order_created: 'bg-purple-100 text-purple-800 border-purple-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    skipped: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    rescheduled: 'bg-orange-100 text-orange-800 border-orange-200',
    paused: 'bg-gray-100 text-gray-800 border-gray-200',
    missed: 'bg-red-100 text-red-800 border-red-200',
  };
  const displayStatus = status ? status.replace('_', ' ') : 'scheduled';
  return <span className={`px-2 py-1 text-xs font-medium rounded border capitalize ${map[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>{displayStatus}</span>;
}

export default function DeliveryCalendarPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // optional month filter as YYYY-MM
      const params = month ? { month } : {};
      const data = await dashboardAPI.getCalendar(params);
      setDeliveries(Array.isArray(data) ? data : (data.deliveries || []));
    } catch (e) {
      const msg = (e?.message || '').toLowerCase();
      if (msg.includes('unauthorized')) router.push('/auth/login');
      else setError('Failed to load delivery calendar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [month]);

  const grouped = useMemo(() => {
    const byDate = {};
    (deliveries || []).forEach(d => {
      const key = (d.delivery_date || d.scheduled_date || d.date || '').slice(0,10);
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(d);
    });
    // sort by date ascending
    return Object.entries(byDate).sort(([a],[b]) => (a > b ? 1 : -1));
  }, [deliveries]);

  const markDelivered = async (id) => {
    setUpdatingId(id);
    setError('');
    try {
      await dashboardAPI.updateDelivery(id, 'delivered');
      setDeliveries(prev => prev.map(x => x.id === id ? { ...x, status: 'delivered' } : x));
    } catch {
      setError('Failed to update delivery status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Delivery Calendar</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border rounded-lg px-3 py-2"
        />
      </div>

      {loading && <div className="text-gray-600">Loading deliveries…</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

      {!loading && !error && (
        grouped.length ? (
          <div className="space-y-6">
            {grouped.map(([date, list]) => (
              <div key={date} className="border rounded-lg">
                <div className="px-4 py-2 bg-gray-50 border-b text-sm font-medium text-gray-700">{new Date(date).toLocaleDateString()}</div>
                <div className="divide-y">
                  {list.map(d => (
                    <div key={d.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {d.plan_name || d.title || 'Scheduled Delivery'}
                          </p>
                          {d.time_slot && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {d.time_slot}
                            </span>
                          )}
                        </div>
                        {d.description && (
                          <p className="text-xs text-gray-600 mt-1">{d.description}</p>
                        )}
                        {d.notes && (
                          <p className="text-xs text-gray-500 mt-0.5">{d.notes}</p>
                        )}
                        {d.locked_items && typeof d.locked_items === 'object' && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(Array.isArray(d.locked_items) ? d.locked_items : []).slice(0, 3).map((item, i) => (
                              <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                                {typeof item === 'string' ? item : item.name || 'Item'}
                              </span>
                            ))}
                            {Array.isArray(d.locked_items) && d.locked_items.length > 3 && (
                              <span className="text-xs text-gray-500">+{d.locked_items.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={(d.status || 'scheduled').toLowerCase()} />
                        {!['delivered', 'completed'].includes((d.status || '').toLowerCase()) && (
                          <button 
                            onClick={() => markDelivered(d.id)} 
                            disabled={updatingId === d.id} 
                            className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {updatingId === d.id ? 'Updating...' : 'Mark Delivered'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-600">No deliveries scheduled for this month.</div>
        )
      )}
    </div>
  );
}

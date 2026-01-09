'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dashboardAPI } from '@/lib/api';
import { Calendar as CalendarIcon, Clock, Edit2, X } from 'lucide-react';

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
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('');

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

  const openRescheduleModal = (delivery) => {
    setRescheduleModal(delivery);
    setNewDate(delivery.delivery_date || delivery.scheduled_date || '');
    setNewTimeSlot(delivery.time_slot || '9am-12pm');
  };

  const handleReschedule = async () => {
    if (!rescheduleModal || !newDate) {
      setError('Please select a new date');
      return;
    }

    setUpdatingId(rescheduleModal.id);
    setError('');
    try {
      await dashboardAPI.updateDelivery(rescheduleModal.id, 'rescheduled');
      // Update the delivery with new date and time
      setDeliveries(prev => prev.map(x => 
        x.id === rescheduleModal.id 
          ? { ...x, status: 'rescheduled', delivery_date: newDate, time_slot: newTimeSlot } 
          : x
      ));
      setRescheduleModal(null);
    } catch {
      setError('Failed to reschedule delivery.');
    } finally {
      setUpdatingId(null);
    }
  };

  const skipDelivery = async (id) => {
    if (!confirm('Are you sure you want to skip this delivery?')) return;
    
    setUpdatingId(id);
    setError('');
    try {
      await dashboardAPI.updateDelivery(id, 'skipped');
      setDeliveries(prev => prev.map(x => x.id === id ? { ...x, status: 'skipped' } : x));
    } catch {
      setError('Failed to skip delivery.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          Delivery Calendar
        </h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {loading && <div className="text-gray-600">Loading deliveries…</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

      {!loading && !error && (
        grouped.length ? (
          <div className="space-y-6">
            {grouped.map(([date, list]) => (
              <div key={date} className="border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 sm:py-4 bg-gradient-to-r from-green-50 to-white border-b text-xs sm:text-sm font-semibold text-gray-800">
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="divide-y divide-gray-100">
                  {list.map(d => (
                    <div key={d.id} className="px-3 sm:px-4 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <p className="text-sm sm:text-base font-semibold text-gray-900">
                                {d.plan_name || d.title || 'Scheduled Delivery'}
                              </p>
                              {d.time_slot && (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded w-fit">
                                  <Clock className="w-3 h-3" />
                                  {d.time_slot}
                                </span>
                              )}
                            </div>
                            {d.description && (
                              <p className="text-xs sm:text-sm text-gray-600 mb-2">{d.description}</p>
                            )}
                            {d.notes && (
                              <p className="text-xs text-gray-500 mb-2">{d.notes}</p>
                            )}
                            {d.locked_items && typeof d.locked_items === 'object' && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {(Array.isArray(d.locked_items) ? d.locked_items : []).slice(0, 3).map((item, i) => (
                                  <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200">
                                    {typeof item === 'string' ? item : item.name || 'Item'}
                                  </span>
                                ))}
                                {Array.isArray(d.locked_items) && d.locked_items.length > 3 && (
                                  <span className="text-xs text-gray-500">+{d.locked_items.length - 3} more</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <StatusBadge status={(d.status || 'scheduled').toLowerCase()} />
                          </div>
                        </div>
                        {!['delivered', 'completed', 'skipped'].includes((d.status || '').toLowerCase()) && (
                          <div className="flex flex-wrap items-center gap-2">
                            <button 
                              onClick={() => openRescheduleModal(d)} 
                              disabled={updatingId === d.id}
                              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                              Reschedule
                            </button>
                            <button 
                              onClick={() => skipDelivery(d.id)} 
                              disabled={updatingId === d.id}
                              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                            >
                              <X className="w-3 h-3" />
                              Skip
                            </button>
                            <button 
                              onClick={() => markDelivered(d.id)} 
                              disabled={updatingId === d.id} 
                              className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {updatingId === d.id ? 'Updating...' : 'Mark Delivered'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No deliveries scheduled for this month</p>
            <p className="text-gray-500 text-sm">Subscribe to a plan to start receiving regular deliveries</p>
          </div>
        )
      )}

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Reschedule Delivery</h3>
              <button 
                onClick={() => setRescheduleModal(null)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-900">{rescheduleModal.plan_name || 'Delivery'}</p>
              <p className="text-xs text-gray-600">Current: {new Date(rescheduleModal.delivery_date || rescheduleModal.scheduled_date).toLocaleDateString()}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Delivery Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Slot
                </label>
                <select
                  value={newTimeSlot}
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="6am-9am">6 AM - 9 AM</option>
                  <option value="9am-12pm">9 AM - 12 PM</option>
                  <option value="12pm-3pm">12 PM - 3 PM</option>
                  <option value="3pm-6pm">3 PM - 6 PM</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={handleReschedule}
                  disabled={updatingId === rescheduleModal.id}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition-colors"
                >
                  {updatingId === rescheduleModal.id ? 'Updating...' : 'Confirm Reschedule'}
                </button>
                <button
                  onClick={() => setRescheduleModal(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

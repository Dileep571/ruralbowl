'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dashboardAPI, authAPI, ordersAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/components/AuthProvider';
import { SectionLoader } from '@/components/LoadingSpinner';
import { Package, Calendar, ShoppingBag, User, CreditCard, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';

function PlanCard({ plan, onSubscribe, loading, isActive }) {
  return (
    <div className={`border-2 rounded-xl p-6 flex flex-col relative ${isActive ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-green-300'} transition-all duration-300`}>
      {isActive && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
          Active Plan
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
      {plan.description && <p className="mt-2 text-sm text-gray-600">{plan.description}</p>}
      <div className="mt-4 text-3xl font-bold text-green-700">₹{Number(plan.price || 0).toFixed(2)}<span className="text-base font-normal text-gray-500">/{plan.interval || 'month'}</span></div>
      <ul className="mt-4 text-sm text-gray-700 space-y-2">
        {Array.isArray(plan.features) ? plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>{f}</span>
          </li>
        )) : null}
      </ul>
      {!isActive && (
        <button
          onClick={() => onSubscribe(plan.id)}
          disabled={loading}
          className="mt-6 w-full inline-flex items-center justify-center px-4 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 font-semibold transition-colors"
        >
          {loading ? 'Subscribing…' : 'Subscribe Now'}
        </button>
      )}
    </div>
  );
}

export default function DashboardHomePage() {
  const router = useRouter();
  const toast = useToast();
  const { isAuthenticated, user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscribingId, setSubscribingId] = useState(null);
  const [success, setSuccess] = useState('');
  const [recentOrders, setRecentOrders] = useState([]);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to access dashboard');
      router.push('/auth/login');
      return;
    }
    load();
  }, [isAuthenticated, router]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [subs, available, orders] = await Promise.all([
        dashboardAPI.getUserSubscription().catch(() => null),
        dashboardAPI.getSubscriptionPlans().catch(() => []),
        ordersAPI.getAll().catch(() => []),
      ]);
      setSubscription(subs && (subs.subscription || subs));
      setPlans(Array.isArray(available) ? available : (available.plans || []));
      const ordersList = Array.isArray(orders) ? orders : (orders.orders || []);
      setRecentOrders(ordersList);
    } catch (e) {
      console.error('Dashboard load error:', e);
      const msg = (e?.message || '').toLowerCase();
      if (msg.includes('unauthorized') || msg.includes('session expired')) {
        router.push('/auth/login');
      } else {
        setError('Failed to load dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const subscribe = async (planId) => {
    // Redirect to checkout page instead of direct subscription
    router.push(`/subscriptions/purchase/${planId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Welcome back, {user?.name || 'User'}! 👋</h1>
              <p className="text-sm sm:text-base text-green-50">Manage your orders, subscriptions, and profile</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          {error}
        </div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <Link href="/dashboard/orders" className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{recentOrders.length}</h3>
            <p className="text-xs sm:text-sm text-gray-600">Total Orders</p>
          </Link>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <CreditCard className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{subscription ? '1' : '0'}</h3>
            <p className="text-xs sm:text-sm text-gray-600">Active Plan</p>
          </div>

          <Link href="/dashboard/calendar" className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">View</h3>
            <p className="text-xs sm:text-sm text-gray-600">Delivery Calendar</p>
          </Link>

          <Link href="/dashboard/profile" className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <User className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Edit</h3>
            <p className="text-xs sm:text-sm text-gray-600">Your Profile</p>
          </Link>
        </div>

        {/* Active Subscription Section */}
        {/* COMMENTED OUT: Subscription feature temporarily disabled
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-green-600" />
            Active Subscription
          </h2>
          {loading ? (
            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="text-gray-600">Loading subscription…</div>
            </div>
          ) : subscription ? (
            <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl p-4 sm:p-6 lg:p-8 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-full text-xs sm:text-sm font-semibold mb-3">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    Active
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{subscription.plan_name || subscription.name}</h3>
                  {subscription.description && <p className="text-sm sm:text-base text-gray-600 mt-2">{subscription.description}</p>}
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <div className="text-2xl sm:text-3xl font-bold text-green-700">₹{Number(subscription.price || 0).toFixed(2)}</div>
                  <div className="text-xs sm:text-sm text-gray-600">per {subscription.interval || 'month'}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-green-200">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-600">Start Date</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{subscription.start_date ? new Date(subscription.start_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-600">Next Renewal</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{subscription.renews_at ? new Date(subscription.renews_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-600">Delivery Days</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{subscription.delivery_days?.join(', ') || 'As scheduled'}</p>
                  </div>
                </div>
              </div>

              {subscription.items && subscription.items.length > 0 && (
                <div className="mt-6 pt-6 border-t border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Included Items:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {subscription.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{item.name || item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 shadow-md text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h3>
              <p className="text-gray-600 mb-4">Subscribe to one of our plans to get fresh vegetables delivered regularly</p>
              <a href="#available-plans" className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm sm:text-base">
                View Available Plans
              </a>
            </div>
          )}
        </div>
        */}

        {/* Available Plans Section */}
        {/* COMMENTED OUT: Subscription plans temporarily disabled
        <div id="available-plans">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-6 h-6 text-green-600" />
            {subscription ? 'Other Plans' : 'Available Plans'}
          </h2>
          {loading ? (
            <div className="text-gray-600">Loading plans…</div>
          ) : plans.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map(p => (
                <PlanCard 
                  key={p.id} 
                  plan={p} 
                  onSubscribe={subscribe} 
                  loading={subscribingId === p.id}
                  isActive={subscription && (subscription.plan_id === p.id || subscription.id === p.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-gray-600 bg-white rounded-xl p-8 text-center">No plans available right now.</div>
          )}
        </div>
        */}
      </div>
    </div>
  );
}

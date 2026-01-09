'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dashboardAPI, authAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
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
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscribingId, setSubscribingId] = useState(null);
  const [success, setSuccess] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        toast.error('Please log in to access dashboard');
        router.push('/auth/login');
        return false;
      }
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
      setIsAuthenticated(true);
      return true;
    };
    
    if (!checkAuth()) return;
    load();
  }, [router]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [subs, available] = await Promise.all([
        dashboardAPI.getUserSubscription().catch(() => null),
        dashboardAPI.getSubscriptionPlans().catch(() => []),
      ]);
      setSubscription(subs && (subs.subscription || subs));
      setPlans(Array.isArray(available) ? available : (available.plans || []));
    } catch (e) {
      const msg = (e?.message || '').toLowerCase();
      if (msg.includes('unauthorized')) router.push('/auth/login');
      else setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const subscribe = async (planId) => {
    setSubscribingId(planId);
    setError('');
    setSuccess('');
    try {
      await dashboardAPI.subscribe(planId);
      setSuccess('Subscription activated successfully');
      await load();
    } catch (e) {
      setError(e?.message || 'Failed to subscribe to plan');
    } finally {
      setSubscribingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/dashboard/orders" className="text-green-700 hover:text-green-800">My Orders</Link>
          <span className="text-gray-300">|</span>
          <Link href="/dashboard/profile" className="text-green-700 hover:text-green-800">Profile</Link>
          <span className="text-gray-300">|</span>
          <Link href="/dashboard/calendar" className="text-green-700 hover:text-green-800">Delivery Calendar</Link>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 border rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
          {loading ? (
            <div className="text-gray-600 mt-3">Loading subscription…</div>
          ) : subscription ? (
            <div className="mt-3">
              <p className="text-sm text-gray-700">Active Plan: <span className="font-medium">{subscription.plan_name || subscription.name}</span></p>
              {subscription.renews_at && <p className="text-sm text-gray-600">Renews: {new Date(subscription.renews_at).toLocaleDateString()}</p>}
              {subscription.status && <p className="text-sm text-gray-600">Status: {subscription.status}</p>}
            </div>
          ) : (
            <p className="text-sm text-gray-700 mt-3">You don’t have an active subscription yet.</p>
          )}
        </div>

        <div className="lg:col-span-1 border rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-900">Quick Links</h2>
          <ul className="mt-2 text-sm text-green-700 space-y-1">
            <li><Link className="hover:text-green-800" href="/products">Browse Products →</Link></li>
            <li><Link className="hover:text-green-800" href="/cart">Go to Cart →</Link></li>
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h2>
        {loading ? (
          <div className="text-gray-600">Loading plans…</div>
        ) : plans.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(p => (
              <PlanCard key={p.id} plan={p} onSubscribe={subscribe} loading={subscribingId === p.id} />
            ))}
          </div>
        ) : (
          <div className="text-gray-600">No plans available right now.</div>
        )}
      </div>
    </div>
  );
}
'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminAPI.getDashboardStats();
      setStats(data.stats);
      setRecentOrders(data.recentOrders || []);
      setTopProducts(data.topProducts || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${stats?.totalRevenue?.toFixed(2) || 0}`,
      icon: '💰',
      color: 'bg-green-100 text-green-700',
      link: '/admin/orders?status=delivered'
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: '📦',
      color: 'bg-blue-100 text-blue-700',
      link: '/admin/orders'
    },
    {
      title: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      icon: '⏳',
      color: 'bg-yellow-100 text-yellow-700',
      link: '/admin/orders?status=pending'
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: '👥',
      color: 'bg-purple-100 text-purple-700',
      link: '/admin/users'
    },
    {
      title: 'Low Stock Products',
      value: stats?.lowStockProducts || 0,
      icon: '⚠️',
      color: 'bg-red-100 text-red-700',
      link: '/admin/products?availability=low_stock'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 text-sm rounded-lg font-semibold shadow-md shadow-primary-500/25 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/35 hover:scale-105"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card, idx) => (
          <Link
            key={idx}
            href={card.link}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-3xl p-2 rounded-lg ${card.color}`}>
                {card.icon}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-1">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </Link>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-green-600 hover:text-green-700">
              View All →
            </Link>
          </div>
          <div className="p-6">
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.slice(0, 5).map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">#{order.id} - {order.user_name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{parseFloat(order.total_amount).toFixed(2)}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Top Selling Products</h2>
            <Link href="/admin/products" className="text-sm text-green-600 hover:text-green-700">
              View All →
            </Link>
          </div>
          <div className="p-6">
            {topProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No sales data yet</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((product, idx) => (
                  <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">
                        {product.total_sold} units sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{parseFloat(product.revenue || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/admin/products/new"
            className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <span className="text-2xl">➕</span>
            <div>
              <p className="font-semibold text-green-700">Add Product</p>
              <p className="text-sm text-green-600">Create new product</p>
            </div>
          </Link>
          
          <Link
            href="/admin/orders?status=pending"
            className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <span className="text-2xl">📋</span>
            <div>
              <p className="font-semibold text-yellow-700">Pending Orders</p>
              <p className="text-sm text-yellow-600">Process orders</p>
            </div>
          </Link>
          
          <Link
            href="/admin/products?availability=low_stock"
            className="flex items-center gap-3 p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <span className="text-2xl">📦</span>
            <div>
              <p className="font-semibold text-red-700">Low Stock</p>
              <p className="text-sm text-red-600">Restock items</p>
            </div>
          </Link>
          
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="text-2xl">👥</span>
            <div>
              <p className="font-semibold text-blue-700">View Users</p>
              <p className="text-sm text-blue-600">Manage customers</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

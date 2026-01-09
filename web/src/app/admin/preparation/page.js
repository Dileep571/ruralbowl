'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { Calendar, Package, TrendingUp, Clock, ChefHat, Download, RefreshCw } from 'lucide-react';

export default function PreparationPage() {
  const [multiDayData, setMultiDayData] = useState(null);
  const [tomorrowData, setTomorrowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tomorrow');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [multiDay, tomorrow] = await Promise.all([
        adminAPI.getMultiDayPreparation(),
        adminAPI.getTomorrowOrders()
      ]);
      setMultiDayData(multiDay);
      setTomorrowData(tomorrow);
    } catch (err) {
      setError(err.message || 'Failed to load preparation data');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) return;

    const headers = ['Product Name', 'Total Quantity', 'Unit', 'Order Count'];
    const rows = data.map(p => [
      p.name,
      p.total_quantity,
      p.unit || 'kg',
      p.order_count
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatQuantity = (qty, unit) => {
    return `${parseFloat(qty).toFixed(2)} ${unit || 'kg'}`;
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '/images/placeholder.png';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    return imageUrl.startsWith('/') ? imageUrl : `/images/${imageUrl}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preparation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  const currentData = activeTab === 'tomorrow' ? tomorrowData : multiDayData?.[activeTab];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-green-600" />
            Preparation Planning
          </h1>
          <p className="text-gray-600 mt-1">Plan your inventory based on upcoming orders</p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tomorrow's Orders Summary Card */}
      {tomorrowData && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-lg p-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Tomorrow's Preparation</h2>
                <p className="text-sm text-gray-600">Orders placed before 6 PM today</p>
              </div>
            </div>
            {tomorrowData.isBeforeCutoff ? (
              <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">
                  Accepting orders until 6 PM
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-lg">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-700">
                  Cutoff time passed
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-gray-600 text-sm mb-1">Delivery Date</p>
              <p className="text-2xl font-bold text-gray-900">{tomorrowData.tomorrowDate}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-gray-600 text-sm mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-green-600">{tomorrowData.totalOrders}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-gray-600 text-sm mb-1">Products to Prepare</p>
              <p className="text-2xl font-bold text-blue-600">{tomorrowData.totalProducts}</p>
            </div>
          </div>

          <p className="text-xs text-gray-600 bg-white rounded px-3 py-2">
            <strong>Note:</strong> Only orders placed before 6 PM today are included for tomorrow's preparation.
            Current time: <strong>{tomorrowData.currentTime}</strong>
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { key: 'tomorrow', label: "Tomorrow's Orders", icon: TrendingUp },
              { key: 'today', label: "Today's Orders", icon: Calendar },
              { key: 'yesterday', label: "Yesterday's Orders", icon: Package }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === tab.key
                    ? 'border-b-2 border-green-600 text-green-600 bg-green-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'tomorrow' && tomorrowData?.products && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Products to prepare for {tomorrowData.tomorrowDate}
                </h3>
                <button
                  onClick={() => downloadCSV(tomorrowData.products, 'tomorrow-preparation')}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
              </div>

              {tomorrowData.products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No orders yet for tomorrow</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tomorrowData.products.map(product => (
                    <div
                      key={product.id}
                      className="bg-gradient-to-br from-white to-gray-50 rounded-lg border-2 border-gray-200 p-4 hover:border-green-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getImageUrl(product.image_url)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1 truncate">{product.name}</h4>
                          <div className="space-y-1">
                            <p className="text-2xl font-bold text-green-600">
                              {formatQuantity(product.total_quantity, product.unit)}
                            </p>
                            <p className="text-xs text-gray-600">
                              From {product.order_count} {product.order_count === 1 ? 'order' : 'orders'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {(activeTab === 'today' || activeTab === 'yesterday') && multiDayData && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Products from {currentData?.date}
                </h3>
                {currentData?.products?.length > 0 && (
                  <button
                    onClick={() => downloadCSV(currentData.products, `${activeTab}-orders`)}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download CSV
                  </button>
                )}
              </div>

              {!currentData?.products || currentData.products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No orders for this day</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentData.products.map(product => (
                    <div
                      key={product.id}
                      className="bg-gradient-to-br from-white to-gray-50 rounded-lg border-2 border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getImageUrl(product.image_url)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1 truncate">{product.name}</h4>
                          <div className="space-y-1">
                            <p className="text-2xl font-bold text-blue-600">
                              {formatQuantity(product.total_quantity, product.unit)}
                            </p>
                            <p className="text-xs text-gray-600">
                              From {product.order_count} {product.order_count === 1 ? 'order' : 'orders'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {multiDayData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['yesterday', 'today', 'tomorrow'].map((day, idx) => {
            const data = day === 'tomorrow' ? tomorrowData : multiDayData[day];
            const colors = ['text-gray-600', 'text-blue-600', 'text-green-600'];
            const bgColors = ['bg-gray-50', 'bg-blue-50', 'bg-green-50'];
            
            return (
              <div key={day} className={`${bgColors[idx]} rounded-lg p-6 border-2 border-gray-200`}>
                <h3 className="text-sm font-medium text-gray-600 uppercase mb-2">{day}</h3>
                <p className="text-xs text-gray-600 mb-3">{data?.date || data?.tomorrowDate}</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-600">Products</p>
                    <p className={`text-2xl font-bold ${colors[idx]}`}>
                      {data?.products?.length || data?.totalProducts || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Orders</p>
                    <p className={`text-xl font-bold ${colors[idx]}`}>
                      {data?.totalOrders || 0}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

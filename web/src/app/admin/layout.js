'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ToastProvider } from '@/components/ToastProvider';
import { adminAPI } from '@/lib/api';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Don't apply layout to login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // Skip auth check for login page
    if (isLoginPage) return;

    // Check if admin is logged in
    const adminUser = localStorage.getItem('adminUser');

    if (!adminUser) {
      router.push('/admin/login');
      return;
    }

    setAdmin(JSON.parse(adminUser));
  }, [router, isLoginPage]);

  const handleLogout = async () => {
    try {
      await adminAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('adminUser');
      router.push('/admin/login');
    }
  };

  // Render login page without layout
  if (isLoginPage) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  // Show loading while checking auth
  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { name: 'Products', path: '/admin/products', icon: '🛍️' },
    { name: 'Orders', path: '/admin/orders', icon: '📦' },
    { name: 'Preparation', path: '/admin/preparation', icon: '👨‍🍳' },
    { name: 'Subscriptions', path: '/admin/subscriptions', icon: '📅' },
    { name: 'Delivery Areas', path: '/admin/delivery-areas', icon: '📍' },
    { name: 'Users', path: '/admin/users', icon: '👥' },
    { name: 'Categories', path: '/admin/categories', icon: '📑' },
  ];

  return (
    <ToastProvider>
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed w-full top-0 z-30">
        <div className="px-2 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:text-gray-900 lg:hidden p-2"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base sm:text-xl font-bold text-green-600">RuralBowl Admin</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" target="_blank" className="hidden md:block text-sm text-gray-600 hover:text-gray-900">
              View Website →
            </Link>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-gray-700">{admin.name}</span>
              <button
                onClick={handleLogout}
                className="text-xs sm:text-sm bg-red-100 text-red-700 px-2 sm:px-3 py-1 rounded hover:bg-red-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-14 sm:pt-14 sm:pt-16">
        {/* Sidebar */}
        <aside className={`bg-white w-64 min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] border-r border-gray-200 fixed lg:sticky top-14 sm:top-16 transition-transform duration-300 z-20 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <nav className="p-3 sm:p-4 space-y-1 sm:space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-50 text-green-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg sm:text-xl">{item.icon}</span>
                  <span className="text-sm sm:text-base">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-3 sm:p-4 border-t border-gray-200 mt-auto hidden sm:block">
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
              <p className="font-semibold mb-1">💡 Quick Tip</p>
              <p>Use keyboard shortcuts for faster navigation</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
    </ToastProvider>
  );
}

'use client';

import { useAuth } from './AuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Orders', href: '/dashboard/orders', icon: '📦' },
    { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
  ];

  const isActive = (href) => pathname === href;

  return (
    <div className="hidden lg:fixed lg:top-0 lg:bottom-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white">
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-6 pt-5">
          <div className="text-2xl">🌾</div>
          <span className="ml-2 text-xl font-bold text-gray-900">Rural Bowl</span>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-900">{user?.name}</div>
          <div className="text-sm text-gray-500">{user?.email}</div>
        </div>

        {/* Navigation */}
        <nav className="mt-5 flex-1 space-y-1 px-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive(item.href)
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="px-6 py-4 pb-6 border-t border-gray-200 mt-auto">
          <button
            onClick={logout}
            className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 w-full"
          >
            <span className="mr-3 text-lg">🚪</span>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
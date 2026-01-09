'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Package, Heart, ShoppingCart, User } from 'lucide-react';
import { useCart } from './CartProvider';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  
  const cartItemCount = items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/products', icon: Package, label: 'Products' },
    { href: '/wishlist', icon: Heart, label: 'Wishlist' },
    { href: '/cart', icon: ShoppingCart, label: 'Cart', badge: cartItemCount },
    { href: '/dashboard', icon: User, label: 'Account' },
  ];

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, icon: Icon, label, badge }) => {
          const active = isActive(href);
          return (
            <Link 
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors duration-200 ${
                active 
                  ? 'text-green-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium ${active ? 'font-semibold' : ''}`}>
                {label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-green-600 rounded-b-full"></div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

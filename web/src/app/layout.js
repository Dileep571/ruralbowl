import { Poppins } from 'next/font/google';
import { CartProvider } from '@/components/CartProvider';
import { AuthProvider } from '@/components/AuthProvider';
import { ToastProvider } from '@/components/ToastProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './globals.css';

const poppins = Poppins({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'Rural Bowl - Farm-Fresh Vegetables, Rice & Mangoes',
  description: 'Fresh vegetables, rice, and mangoes directly from farmers to your table',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <ToastProvider>
          <AuthProvider>
              <CartProvider>
              <div className="min-h-screen flex flex-col">
                  <Header />
                  <main className="flex-grow">
                      {children}
                  </main>
                  <Footer />
              </div>
              </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
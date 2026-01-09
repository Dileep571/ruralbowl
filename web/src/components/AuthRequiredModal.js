'use client';
import { useRouter } from 'next/navigation';

export default function AuthRequiredModal({ 
  isOpen, 
  onClose, 
  redirectTo = '/checkout',
  title = 'Account Required',
  message = 'Please create an account or log in to proceed with checkout. Your cart items will be saved.',
  footerNote = 'Your cart items are saved locally and will be merged with your account after login.'
}) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSignup = () => {
    onClose();
    router.push(`/auth/signup?redirect=${redirectTo}`);
  };

  const handleLogin = () => {
    onClose();
    router.push(`/auth/login?redirect=${redirectTo}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-gray-600">
            {message}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSignup}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
          >
            Create Account
          </button>
          <button
            onClick={handleLogin}
            className="w-full py-3 px-4 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 font-semibold transition-colors"
          >
            Log In
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>

        {footerNote && (
          <p className="text-xs text-gray-500 text-center mt-4">
            {footerNote}
          </p>
        )}
      </div>
    </div>
  );
}

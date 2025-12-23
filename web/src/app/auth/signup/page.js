'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register as registerAPI, login as loginAPI } from '@/lib/auth';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/components/CartProvider';
import { useToast } from '@/components/ToastProvider';
import { LoadingButton } from '@/components/LoadingSpinner';
import { validators } from '@/utils/validation';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { login } = useAuth();
  const { mergeGuestCartToServer } = useCart();
  const router = useRouter();
  const toast = useToast();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const validateForm = () => {
    const { name, email, password, confirmPassword, phone } = formData;
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // Phone validation - only validate if phone is provided
    if (phone && phone.trim().length > 0) {
      const cleanPhone = phone.trim().replace(/[\s\-()]/g, '');
      
      if (cleanPhone.length < 6) {
        setError('Phone number must be at least 6 digits');
        return false;
      }
      if (!/^[+]?\d+$/.test(cleanPhone)) {
        setError('Please enter a valid phone number (digits only)');
        return false;
      }
    }
    
    if (!termsAccepted) {
      setError('Please accept the terms and conditions');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { confirmPassword, ...userData } = formData;
      
      const result = await registerAPI(userData.name, userData.email, userData.password, userData.phone, userData.address);
      
      if (result.success) {
        // Token is automatically stored by authAPI.register
        // Just update AuthProvider context
        login(result.data.user, result.data.token);
        // Merge guest cart after registration
        await mergeGuestCartToServer();
        toast.success('Account created successfully! Welcome! 🎉');
        setTimeout(() => router.push('/dashboard'), 500);
      } else {
        console.error('Registration failed:', result.error);
        const errorMsg = result.error || 'Error creating account. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Signup error:', err);
      const errorMsg = err.message || 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-green-100 p-3 rounded-full"><div className="text-4xl">🌱</div></div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">Already have an account?{' '}<Link href="/auth/login" className="font-medium text-green-600 hover:text-green-500 transition-colors">Sign in here</Link></p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl sm:px-10 border border-gray-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Enter your full name" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Enter your email" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Enter your phone number" />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
              <textarea id="address" name="address" rows={3} value={formData.address} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" placeholder="Enter your delivery address" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Enter your password (min. 6 characters)" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Confirm your password" />
            </div>
            <div className="flex items-start space-x-2 pt-2">
              <input id="terms" name="terms" type="checkbox" required checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1" />
              <label htmlFor="terms" className="text-sm text-gray-900">I agree to the <Link href="/terms" className="text-green-600 hover:text-green-500">Terms</Link> and <Link href="/privacy" className="text-green-600 hover:text-green-500">Privacy Policy</Link></label>
            </div>
            <div className="pt-2">
              <LoadingButton 
                type="submit" 
                loading={loading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Create account
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

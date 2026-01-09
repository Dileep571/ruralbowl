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
  const [step, setStep] = useState(1); // 1: Form, 2: OTP Verification
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { login } = useAuth();
  const { mergeGuestCartToServer } = useCart();
  const router = useRouter();
  const toast = useToast();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };
  
  // Resend timer effect
  useState(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const validateForm = () => {
    const { name, email, password, confirmPassword, phone } = formData;
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return false;
    }
    
    // Comprehensive email validation
    const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address (e.g., user@example.com)');
      return false;
    }
    
    // Check for common email mistakes
    if (trimmedEmail.includes('..') || trimmedEmail.startsWith('.') || trimmedEmail.endsWith('.')) {
      setError('Email address contains invalid characters');
      return false;
    }
    
    // Check email length
    if (trimmedEmail.length > 254) {
      setError('Email address is too long');
      return false;
    }
    
    const [localPart, domain] = trimmedEmail.split('@');
    if (localPart.length > 64) {
      setError('Email address is invalid');
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

  // Send OTP to email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }
    
    setSendingOTP(true);
    setError('');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStep(2);
        setResendTimer(60);
        toast.success('OTP sent to your email! Check your inbox.');
      } else {
        setError(data.message || 'Failed to send OTP');
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      const errorMsg = 'Failed to send OTP. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSendingOTP(false);
    }
  };
  
  // Resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setSendingOTP(true);
    setError('');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/otp/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResendTimer(60);
        toast.success('OTP resent successfully!');
      } else {
        setError(data.message || 'Failed to resend OTP');
        toast.error(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      toast.error('Failed to resend OTP');
    } finally {
      setSendingOTP(false);
    }
  };
  
  // Verify OTP and complete registration
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // First verify OTP
      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email.trim().toLowerCase(),
          otp: otp.trim()
        })
      });
      
      const verifyData = await verifyResponse.json();
      
      if (!verifyResponse.ok) {
        setError(verifyData.message || 'Invalid OTP');
        toast.error(verifyData.message || 'Invalid OTP');
        setLoading(false);
        return;
      }
      
      // OTP verified, now register
      const { confirmPassword, ...userData } = formData;
      const result = await registerAPI(userData.name, userData.email, userData.password, userData.phone);
      
      if (result.success) {
        // Tokens are now in HttpOnly cookies, only pass user data
        login(result.data.user);
        toast.success('Account created successfully! Welcome! 🎉');
        setTimeout(() => router.push('/dashboard'), 800);
      } else {
        const errorMsg = result.error || 'Error creating account. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Verification error:', err);
      const errorMsg = err.message || 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    // This is now for initial form submission (sending OTP)
    return handleSendOTP(e);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-green-100 p-3 rounded-full"><div className="text-4xl">{step === 1 ? '🌱' : '🔐'}</div></div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {step === 1 ? 'Create your account' : 'Verify your email'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 1 ? (
            <>Already have an account?{' '}<Link href="/auth/login" className="font-medium text-green-600 hover:text-green-500 transition-colors">Sign in here</Link></>
          ) : (
            <>Enter the OTP sent to <strong>{formData.email}</strong></>
          )}
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl sm:px-10 border border-gray-100">
          {step === 1 ? (
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
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Enter your 10-digit phone number" maxLength="10" />
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
                  loading={sendingOTP}
                  className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Send Verification Code
                </LoadingButton>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOTP}>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
              
              <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg text-sm text-blue-800">
                <p className="font-medium">📧 Check your email</p>
                <p className="text-xs mt-1">We've sent a 6-digit verification code to your email address.</p>
              </div>
              
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">Enter OTP Code</label>
                <input
                  id="otp"
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    if (error) setError('');
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  required
                />
                <p className="text-xs text-gray-500 mt-2 text-center">Code expires in 10 minutes</p>
              </div>
              
              <div>
                <LoadingButton 
                  type="submit" 
                  loading={loading}
                  className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Verify & Create Account
                </LoadingButton>
              </div>
              
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-gray-600">
                    Resend OTP in <span className="font-semibold text-green-600">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={sendingOTP}
                    className="text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                  >
                    {sendingOTP ? 'Sending...' : 'Resend OTP'}
                  </button>
                )}
              </div>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setError('');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  ← Change email address
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

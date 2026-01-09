// Reusable Loading Components with Innovative Designs
'use client';
import { PulseLoader, BounceLoader, RingLoader } from 'react-spinners';

// Full page loader
export function FullPageLoader({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex items-center justify-center">
          <RingLoader color="#16a34a" size={80} speedMultiplier={0.8} />
        </div>
        <p className="mt-6 text-gray-700 font-medium animate-pulse">{message}</p>
      </div>
    </div>
  );
}

// Modern Spinner component with different types
export function Spinner({ size = 'md', type = 'pulse' }) {
  const sizeMap = {
    sm: 30,
    md: 50,
    lg: 70,
  };

  const spinnerSize = sizeMap[size] || 50;

  if (type === 'bounce') {
    return (
      <div className="flex justify-center">
        <BounceLoader color="#16a34a" size={spinnerSize} />
      </div>
    );
  }

  if (type === 'ring') {
    return (
      <div className="flex justify-center">
        <RingLoader color="#16a34a" size={spinnerSize} speedMultiplier={0.9} />
      </div>
    );
  }

  // Default pulse loader
  return (
    <div className="flex justify-center">
      <PulseLoader color="#16a34a" size={spinnerSize / 5} speedMultiplier={0.8} />
    </div>
  );
}

// Button with loading state
export function LoadingButton({ 
  loading, 
  disabled, 
  children, 
  className = '', 
  ...props 
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`relative ${className} ${(disabled || loading) ? 'opacity-60 cursor-not-allowed' : ''}`}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" color="gray" />
        </span>
      )}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
    </button>
  );
}

// Section loader
export function SectionLoader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16">
      <RingLoader color="#16a34a" size={60} speedMultiplier={0.8} />
      <p className="mt-6 text-gray-700 font-medium text-sm sm:text-base animate-pulse">{message}</p>
    </div>
  );
}

// Inline Loader for small spaces
export function InlineLoader() {
  return (
    <div className="inline-flex items-center gap-2">
      <PulseLoader color="#16a34a" size={6} speedMultiplier={0.8} />
    </div>
  );
}

// Skeleton loader for cards
export function SkeletonCard() {
  return (
    <div className="border rounded-lg p-4 animate-pulse">
      <div className="bg-gray-300 h-48 rounded mb-4"></div>
      <div className="bg-gray-300 h-4 rounded w-3/4 mb-2"></div>
      <div className="bg-gray-300 h-4 rounded w-1/2"></div>
    </div>
  );
}

// Table row skeleton
export function SkeletonTableRow({ columns = 4 }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="bg-gray-300 h-4 rounded"></div>
        </td>
      ))}
    </tr>
  );
}

// Button spinner (inline spinner for buttons)
export function ButtonSpinner({ className = '' }) {
  return (
    <PulseLoader color="currentColor" size={5} className={className} speedMultiplier={0.8} />
  );
}

// Card Loader with shimmer effect
export function CardLoader() {
  return (
    <div className="bg-white rounded-xl shadow-elegant overflow-hidden">
      <div className="animate-pulse">
        <div className="aspect-square bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer"></div>
        <div className="p-3 sm:p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

// Add shimmer animation to globals.css
const shimmerStyle = `
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.animate-shimmer {
  animation: shimmer 2s ease-in-out infinite;
}
`;

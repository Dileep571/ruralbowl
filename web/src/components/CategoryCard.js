'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CategoryCard({ category }) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    router.push(`/products?category=${category.slug}`);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.warn(`Failed to load image for category: ${category.name}`);
    setImageError(true);
    setImageLoaded(true);
  };

  const showFallback = !category.image_url || imageError;

  return (
    <div 
      className="category-card relative h-72 rounded-xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl group"
      onClick={handleClick}
    >
      {/* Background Image or Gradient */}
      {!showFallback ? (
        <div className="absolute inset-0">
          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 animate-pulse"></div>
          )}
          
          {/* Actual image with zoom effect */}
          <img 
            src={category.image_url}
            alt={category.name}
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {/* Gradient overlay - darker at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/90 transition-all duration-300"></div>
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-green-600 to-emerald-700">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          </div>
          {/* Icon for fallback */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
            <svg className="w-32 h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      )}

      {/* Content Overlay */}
      <div className="relative h-full flex flex-col justify-end p-6">
        <div className="text-white transform transition-all duration-300 group-hover:translate-y-[-8px]">
          <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold mb-3">
            Shop Now
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-2 drop-shadow-lg">{category.name}</h3>
          <p className="text-sm opacity-90 drop-shadow-md line-clamp-2 mb-3">
            {category.description || `Explore our ${category.name.toLowerCase()} collection`}
          </p>
          <div className="flex items-center text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span>Browse Collection</span>
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
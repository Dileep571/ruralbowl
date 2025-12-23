'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { ButtonSpinner } from './LoadingSpinner';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    await addToCart(product, 1);
    setAdding(false);
  };

  const discount = product.originalPrice > product.price 
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <div className="product-card group">
      <Link href={`/products/${product.slug}`}>
        <div className="relative overflow-hidden">
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">Product Image</span>
          </div>
          {discount > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-sm rounded">
              {discount}% OFF
            </span>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 group-hover:text-green-600 transition-colors">
            {product.name}
          </h3>
          
          <div className="flex items-center mb-3">
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-sm ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-2">({product.reviews})</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-green-600">₹{product.price}/{product.unit}</span>
              {product.originalPrice > product.price && (
                <span className="text-sm text-gray-500 line-through ml-2">₹{product.originalPrice}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
      
      <div className="p-4 pt-0">
        <button 
          onClick={handleAddToCart}
          disabled={adding}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {adding ? (
            <>
              <ButtonSpinner className="text-white mr-2" />
              Adding...
            </>
          ) : (
            'Add to Cart'
          )}
        </button>
      </div>
    </div>
  );
}
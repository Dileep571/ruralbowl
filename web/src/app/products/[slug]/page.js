'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsAPI } from '@/lib/api';
import { useCart } from '@/components/CartProvider';
import api from '@/lib/authApi';
import Link from 'next/link';
import { ChevronRight, Home, ShoppingCart, Minus, Plus, Check, X, Package, Truck, Shield, Star, Heart } from 'lucide-react';
import AuthRequiredModal from '@/components/AuthRequiredModal';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;
  const { addToCart: addToCartContext } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!slug) return;
      setLoading(true);
      setError('');
      try {
        const data = await productsAPI.getById(slug);
        if (!isMounted) return;
        setProduct(data);
        
        // Set default variant if product has variants
        if (data.has_variants && data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }

        // Load related products from same category
        if (data.category_slug) {
          const related = await productsAPI.getAll({ category: data.category_slug, limit: 4 });
          if (isMounted) {
            const relatedArray = Array.isArray(related) ? related : [];
            setRelatedProducts(relatedArray.filter(p => p.slug !== data.slug).slice(0, 4));
          }
        }
      } catch (e) {
        if (!isMounted) return;
        setError('Failed to load product.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [slug]);

  const toggleWishlist = async () => {
    if (!api.isAuthenticated()) {
      setShowAuthModal(true);
      return;
    }
    
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await api.removeFromWishlist(product.id);
        setInWishlist(false);
        setMessage('Removed from wishlist');
      } else {
        await api.addToWishlist(product.id);
        setInWishlist(true);
        setMessage('Added to wishlist');
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Wishlist error:', error);
      const errorMsg = error?.message || '';
      if (errorMsg.toLowerCase().includes('already in wishlist')) {
        setInWishlist(true);
        setMessage('Already in wishlist');
      } else {
        setMessage('Failed to update wishlist');
      }
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setWishlistLoading(false);
    }
  };
  
  const addToCart = async () => {
    if (!product) return;
    
    // Check if product has variants and variant is selected
    if (product.has_variants && !selectedVariant) {
      setMessage('Please select a variant');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    setAdding(true);
    setMessage('');
    try {
      // If product has variants, pass variant_id in the product object
      const productToAdd = product.has_variants 
        ? { ...product, variant_id: selectedVariant.id, price: selectedVariant.price }
        : product;
        
      const success = await addToCartContext(productToAdd, quantity);
      if (success) {
        setMessage('Added to cart!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to add to cart.');
      }
    } catch (e) {
      setMessage('Failed to add to cart.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-2">Product Not Found</h2>
          <p className="text-red-600 mb-4">{error || 'The product you are looking for does not exist.'}</p>
          <Link
            href="/products"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  const discount = product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6">
        <ol className="flex items-center space-x-2">
          <li><Link href="/" className="text-gray-600 hover:text-green-600">Home</Link></li>
          <li className="text-gray-400">/</li>
          <li><Link href="/products" className="text-gray-600 hover:text-green-600">Products</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">{product.name}</li>
        </ol>
      </nav>

      {/* Product Detail Section */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="space-y-4">
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img
              src={product.image_url || 'https://via.placeholder.com/600'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-gray-600">{product.category_name || 'Uncategorized'}</p>
          </div>

          {/* Price */}
          <div className="flex items-baseline space-x-3">
            <span className="text-4xl font-bold text-green-600">
              ₹{product.has_variants && selectedVariant ? selectedVariant.price : product.price}
            </span>
            {discount > 0 && !product.has_variants && (
              <>
                <span className="text-2xl text-gray-400 line-through">
                  ₹{product.original_price}
                </span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-semibold">
                  {discount}% OFF
                </span>
              </>
            )}
            {selectedVariant && selectedVariant.original_price > selectedVariant.price && (
              <>
                <span className="text-2xl text-gray-400 line-through">
                  ₹{selectedVariant.original_price}
                </span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-semibold">
                  {Math.round(((selectedVariant.original_price - selectedVariant.price) / selectedVariant.original_price) * 100)}% OFF
                </span>
              </>
            )}
            {!product.has_variants && <span className="text-gray-600">/{product.unit || 'kg'}</span>}
          </div>

          {/* Variant Selector */}
          {product.has_variants && product.variants && product.variants.length > 0 && (
            <div className="border-t border-b py-6">
              <label className="block text-gray-900 font-semibold mb-3">
                Select {product.variants[0]?.variant_name || 'Option'}:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    disabled={!variant.is_available || variant.stock_quantity === 0}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      selectedVariant?.id === variant.id
                        ? 'border-green-600 bg-green-50'
                        : variant.is_available && variant.stock_quantity > 0
                        ? 'border-gray-300 hover:border-green-400'
                        : 'border-gray-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{variant.variant_value}</div>
                      <div className="text-sm text-green-600 font-medium mt-1">₹{variant.price}</div>
                      {variant.stock_quantity === 0 && (
                        <div className="text-xs text-red-600 mt-1">Out of stock</div>
                      )}
                      {variant.stock_quantity > 0 && variant.stock_quantity < 10 && (
                        <div className="text-xs text-orange-600 mt-1">Only {variant.stock_quantity} left</div>
                      )}
                    </div>
                    {selectedVariant?.id === variant.id && (
                      <div className="absolute top-1 right-1 bg-green-600 rounded-full p-0.5">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Status */}
          <div>
            {product.has_variants && selectedVariant
              ? (selectedVariant.is_available && selectedVariant.stock_quantity > 0 ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    In Stock ({selectedVariant.stock_quantity} available)
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Out of Stock
                  </span>
                ))
              : product.stock_quantity > 0 ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    In Stock ({product.stock_quantity} available)
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Out of Stock
                  </span>
                )
            }
          </div>

          {/* Quantity Selector */}
          {product.has_variants && selectedVariant
            ? selectedVariant.is_available && selectedVariant.stock_quantity > 0 && (
                <div className="flex items-center space-x-4">
                  <label className="text-gray-700 font-medium">Quantity:</label>
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center border-x py-2 focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(selectedVariant.stock_quantity, quantity + 1))}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            : !product.has_variants && product.stock_quantity > 0 && (
                <div className="flex items-center space-x-4">
                  <label className="text-gray-700 font-medium">Quantity:</label>
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center border-x py-2 focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              )
          }

          {/* Add to Cart Button */}
          {(product.has_variants && selectedVariant 
            ? selectedVariant.is_available && selectedVariant.stock_quantity > 0
            : product.stock_quantity > 0) && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={addToCart}
                  disabled={adding || (product.has_variants && !selectedVariant)}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {adding ? (
                    <span>Adding...</span>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
                <button
                  onClick={toggleWishlist}
                  disabled={wishlistLoading}
                  className="bg-white border-2 border-green-600 text-green-600 p-3 rounded-lg font-semibold hover:bg-green-50 disabled:opacity-50 transition-colors"
                  title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart className={`w-6 h-6 ${inWishlist ? 'fill-green-600' : ''}`} />
                </button>
              </div>
              {message && (
                <p className={`text-center text-sm ${message.includes('Failed') || message.includes('select') ? 'text-red-600' : 'text-green-600'}`}>
                  {message}
                </p>
              )}
            </div>
          )}

          {/* Product Features */}
          {product.features && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Key Features:</h3>
              <ul className="space-y-2">
                {product.features.split(',').map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{feature.trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mb-12">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('description')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'description'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Description
            </button>
            {product.nutritional_info && (
              <button
                onClick={() => setActiveTab('nutrition')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'nutrition'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Nutritional Info
              </button>
            )}
          </nav>
        </div>

        <div className="prose max-w-none">
          {activeTab === 'description' && (
            <div>
              <p className="text-gray-700 leading-relaxed">
                {product.description || 'No description available.'}
              </p>
            </div>
          )}
          {activeTab === 'nutrition' && product.nutritional_info && (
            <div>
              <p className="text-gray-700 leading-relaxed">
                {product.nutritional_info}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory md:grid md:grid-cols-4 md:gap-6 scrollbar-hide">
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                href={`/products/${relatedProduct.slug}`}
                className="group flex-shrink-0 w-[45%] sm:w-[30%] md:w-auto snap-start"
              >
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow h-full">
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={relatedProduct.image_url || 'https://via.placeholder.com/300'}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                      {relatedProduct.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-green-600 font-bold">
                        ₹{relatedProduct.price}
                      </span>
                      <span className="text-sm text-gray-500">
                        /{relatedProduct.unit || 'kg'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectTo={`/products/${slug}`}
        title="Sign In to Save to Wishlist"
        message="Create an account or log in to save items to your wishlist and access them from any device."
        footerNote={null}
      />
    </div>
  );
}

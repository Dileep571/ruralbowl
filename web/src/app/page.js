"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import SubscriptionPlanCard from '../components/SubscriptionPlanCard';
import { FullPageLoader, SkeletonCard } from '../components/LoadingSpinner';
import { getProducts, getCategories, getTestimonials, getSubscriptionPlans } from '../lib/data';

export default function Home() {
  const [popularProducts, setPopularProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prods, cats, tests, plans] = await Promise.all([
          getProducts({ limit: 8 }),
          getCategories(),
          getTestimonials(),
          getSubscriptionPlans()
        ]);
        setPopularProducts(prods || []);
        setCategories(cats || []);
        setTestimonials(tests || []);
        setSubscriptionPlans(plans || []);
      } catch (error) {
        console.error('Error loading homepage data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <FullPageLoader message="Loading Rural Bowl..." />;
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-96 bg-cover bg-center" style={{ backgroundImage: "url('/images/banner-1.png')" }}>
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="text-white max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Fresh Farm Produce</h1>
            <p className="text-sm sm:text-base md:text-xl mb-8">Straight from farm to your table</p>
            <div className="flex space-x-4">
              <Link href="/products" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                Shop Now
              </Link>
              <Link href="#subscription-plans" className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:text-green-600 transition">
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {[
              { icon: '🌿', title: 'Directly from Farmers', text: 'Fresh from the farm to your table' },
              { icon: '👨‍🌾', title: 'Farm Fresh', text: 'Harvested at peak freshness' },
              { icon: '📦', title: 'Careful Packing', text: 'Preserved purity and quality' },
              { icon: '🚚', title: 'Fast Delivery', text: 'Order today, delivered tomorrow' }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Our Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {categories.slice(0, 4).map(category => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Products */}
      {popularProducts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Popular Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {popularProducts.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/products" className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                View All Products
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Subscription Plans Section */}
      {subscriptionPlans.length > 0 && (
        <section id="subscription-plans" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Vegetable Subscription Plans</h2>
              <p className="text-sm sm:text-base md:text-xl text-gray-600 max-w-3xl mx-auto">
                Choose the perfect plan for your family. Fresh vegetables directly from farmers, delivered regularly to your doorstep.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {subscriptionPlans.map(plan => (
                <SubscriptionPlanCard key={plan.id} plan={plan} />
              ))}
            </div>

            {/* Plan Benefits */}
            <div className="mt-16 bg-green-50 rounded-lg p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-center mb-8">Why Choose Our Subscription Plans?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-4xl mb-4">💰</div>
                  <h4 className="font-semibold text-lg mb-2">Save Money</h4>
                  <p className="text-gray-600">Up to 25% cheaper than buying individually</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">⏰</div>
                  <h4 className="font-semibold text-lg mb-2">Save Time</h4>
                  <p className="text-gray-600">No more weekly grocery trips</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">🌱</div>
                  <h4 className="font-semibold text-lg mb-2">Always Fresh</h4>
                  <p className="text-gray-600">Farm-fresh vegetables delivered regularly</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">What Our Customers Say</h2>

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-full flex items-center justify-end gap-2">
                  <button
                    aria-label="Previous"
                    onClick={() => {
                      const c = document.getElementById('testimonials-slider');
                      if (c) c.scrollBy({ left: - (c.clientWidth * 0.8), behavior: 'smooth' });
                    }}
                    className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md"
                  >◀</button>
                  <button
                    aria-label="Next"
                    onClick={() => {
                      const c = document.getElementById('testimonials-slider');
                      if (c) c.scrollBy({ left: (c.clientWidth * 0.8), behavior: 'smooth' });
                    }}
                    className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md"
                  >▶</button>
                </div>
              </div>

              <div id="testimonials-slider" className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4">
                {testimonials.map(testimonial => (
                  <div key={testimonial.id} className="snap-center flex-shrink-0 w-full sm:w-[360px] md:w-[420px] bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-400">
                          {i < (testimonial.rating || 5) ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm md:text-base text-gray-700 mb-4 italic">&ldquo;{testimonial.text || testimonial.message}&rdquo;</p>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

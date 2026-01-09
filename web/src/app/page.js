"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import SubscriptionPlanCard from '../components/SubscriptionPlanCard';
import Testimonials from '../components/Testimonials';
import { FullPageLoader, SkeletonCard } from '../components/LoadingSpinner';
import { getProducts, getCategories, getTestimonials, getSubscriptionPlans, getDeliveryAreas } from '../lib/data';

export default function Home() {
  const [popularProducts, setPopularProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [deliveryAreas, setDeliveryAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prods, cats, tests, plans, areas] = await Promise.all([
          getProducts({ limit: 8 }),
          getCategories(),
          getTestimonials(),
          getSubscriptionPlans(),
          getDeliveryAreas()
        ]);
        setPopularProducts(prods || []);
        setCategories(cats || []);
        setTestimonials(tests || []);
        setSubscriptionPlans(plans || []);
        console.log('Setting delivery areas on homepage:', areas);
        setDeliveryAreas(areas || []);
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
      <section className="relative h-[500px] md:h-[600px] bg-cover bg-center overflow-hidden" style={{ backgroundImage: "url('/images/banner-1.png')" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="text-white max-w-2xl animate-fade-in">
            <div className="inline-block mb-4 px-4 py-2 bg-green-600/90 backdrop-blur-sm rounded-full text-sm font-semibold">
              🌿 100% Farm Fresh
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 leading-tight">
              Fresh Farm Produce
              <span className="block text-green-400 mt-2">Direct to Your Door</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl mb-8 text-gray-100">Experience the authentic taste of farm-fresh vegetables, delivered straight from rural farms to your table</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className="group px-4 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2 text-sm sm:text-base">
                Shop Now
                <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link href="#subscription-plans" className="px-4 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-white/10 backdrop-blur-md border-2 border-white text-white rounded-lg hover:bg-white hover:text-green-600 transition-all duration-300 font-semibold text-sm sm:text-base">
                View Plans
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Delivery Information Banner */}
      <section className="py-8 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-600">
            <div className="flex items-start gap-4">
              <div className="text-4xl">📦</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Fast & Reliable Delivery</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-lg mt-1">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Order Before 6 PM</p>
                      <p className="text-sm text-gray-600">Get delivery the next day</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg mt-1">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Serving Chittoor</p>
                      <p className="text-sm text-gray-600">
                        {(() => {
                          console.log('Rendering delivery areas. Length:', deliveryAreas.length, 'Areas:', deliveryAreas);
                          return deliveryAreas.length > 0 
                            ? `${deliveryAreas.slice(0, 3).map(a => a.area_name).join(', ')}${deliveryAreas.length > 3 ? ' & more' : ''}`
                            : 'KR Palli, Kattamanchi, Mittoor & more';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {[
              { icon: '🌿', title: 'Procured from FPO', text: 'Fresh from the farm to your table' },
              { icon: '👨‍🌾', title: 'Farm Fresh', text: 'Harvested at peak freshness' },
              { icon: '📦', title: 'Careful Packing', text: 'Preserved purity and quality' },
              { icon: '🚚', title: 'Fast Delivery', text: 'Order today, delivered tomorrow' }
            ].map((feature, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="text-4xl sm:text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-800">{feature.title}</h3>
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
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Shop by Category</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Explore our wide range of farm-fresh products directly from farmers</p>
            </div>
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
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Popular Products</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Top picks loved by our customers</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {popularProducts.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/products" className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 text-sm sm:text-base">
                View All Products
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
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

      {/* Testimonials Carousel */}
      <Testimonials />
    </>
  );
}

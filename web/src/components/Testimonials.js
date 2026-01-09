'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { getDeliveryAreas } from '../lib/data';

const testimonials = [
  {
    id: 1,
    name: 'Priya',
    location: 'Chittoor',
    rating: 5,
    text: 'The vegetables are always fresh and delivered on time. I love that I can support local farmers directly through Rural Bowl!',
    image: '/images/testimonial-1.jpg',
  },
  {
    id: 2,
    name: 'Rajesh Kumar',
    location: 'Chittoor',
    rating: 5,
    text: 'Best quality produce at reasonable prices. The subscription service has made my life so much easier. Highly recommended!',
    image: '/images/testimonial-2.jpg',
  },
  {
    id: 3,
    name: 'Anitha',
    location: 'Chittoor',
    rating: 5,
    text: 'Farm-fresh vegetables delivered to my doorstep. The quality is exceptional and the service is reliable. Thank you Rural Bowl!',
    image: '/images/testimonial-3.jpg',
  },
  {
    id: 4,
    name: 'Suresh Reddy',
    location: 'Chittoor',
    rating: 5,
    text: 'I appreciate the transparency. The products are absolutely fresh.',
    image: '/images/testimonial-4.jpg',
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [deliveryAreas, setDeliveryAreas] = useState([]);

  useEffect(() => {
    const loadAreas = async () => {
      const areas = await getDeliveryAreas();
      setDeliveryAreas(areas);
    };
    loadAreas();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToSlide = (index) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-green-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            What Our Customers Say
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Join thousands of happy customers who trust Rural Bowl for their daily fresh produce
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto px-8 sm:px-0">
          {/* Main Testimonial Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-12 relative overflow-hidden">
            {/* Quote Icon */}
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 opacity-10">
              <Quote className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 text-green-600" />
            </div>

            <div className="relative z-10">
              {/* Rating */}
              <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-4 sm:mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      i < testimonials[currentIndex].rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 text-center mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0">
                "{testimonials[currentIndex].text}"
              </p>

              {/* Customer Info */}
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg flex-shrink-0">
                  {testimonials[currentIndex].name.charAt(0)}
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 text-base sm:text-lg">
                    {testimonials[currentIndex].name}
                  </h4>
                  <p className="text-sm sm:text-base text-gray-600">{testimonials[currentIndex].location}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 md:-translate-x-12 bg-white rounded-full p-2 sm:p-3 shadow-lg hover:bg-green-50 transition-colors group z-20"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-green-600" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 md:translate-x-12 bg-white rounded-full p-2 sm:p-3 shadow-lg hover:bg-green-50 transition-colors group z-20"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-green-600" />
          </button>

          {/* Dots Indicator - Hidden on mobile */}
          <div className="hidden sm:flex items-center justify-center gap-2 mt-6 sm:mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 h-3 bg-green-600'
                    : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 sm:mt-16 max-w-3xl mx-auto">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center mb-6 sm:mb-8 px-4">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-3 sm:space-y-4">
            <details className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden group">
              <summary className="cursor-pointer p-4 sm:p-5 text-sm sm:text-base font-semibold text-gray-900 hover:bg-green-50 transition-colors flex justify-between items-center gap-4">
                <span>What areas do you deliver to?</span>
                <span className="text-green-600 text-xl sm:text-2xl group-open:rotate-45 transition-transform flex-shrink-0">+</span>
              </summary>
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm sm:text-base text-gray-600 leading-relaxed">
                We currently deliver to the following areas in Chittoor, Andhra Pradesh:
                <ul className="mt-2 ml-6 list-disc space-y-1">
                  {deliveryAreas.length > 0 ? (
                    deliveryAreas.map(area => (
                      <li key={area.id}>{area.area_name}</li>
                    ))
                  ) : (
                    <>
                      <li>KR Palli</li>
                      <li>Kattamanchi</li>
                      <li>Mittoor</li>
                    </>
                  )}
                </ul>
                <p className="mt-3">We're constantly expanding our delivery network to serve more areas. Stay tuned!</p>
              </div>
            </details>

            <details className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden group">
              <summary className="cursor-pointer p-4 sm:p-5 text-sm sm:text-base font-semibold text-gray-900 hover:bg-green-50 transition-colors flex justify-between items-center gap-4">
                <span>How fresh are your products?</span>
                <span className="text-green-600 text-xl sm:text-2xl group-open:rotate-45 transition-transform flex-shrink-0">+</span>
              </summary>
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm sm:text-base text-gray-600 leading-relaxed">
                All our vegetables and groceries are sourced directly from local farmers and delivered fresh. We follow a farm-to-table approach, ensuring products reach you within 24-48 hours of harvest. We guarantee 100% freshness!
              </div>
            </details>

            <details className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden group">
              <summary className="cursor-pointer p-4 sm:p-5 text-sm sm:text-base font-semibold text-gray-900 hover:bg-green-50 transition-colors flex justify-between items-center gap-4">
                <span>What is the delivery time?</span>
                <span className="text-green-600 text-xl sm:text-2xl group-open:rotate-45 transition-transform flex-shrink-0">+</span>
              </summary>
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm sm:text-base text-gray-600 leading-relaxed">
                Orders placed before 6 PM will be delivered the next day. We deliver between 7 AM to 9 PM. You can also choose a preferred delivery time slot during checkout.
              </div>
            </details>

            <details className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden group">
              <summary className="cursor-pointer p-4 sm:p-5 text-sm sm:text-base font-semibold text-gray-900 hover:bg-green-50 transition-colors flex justify-between items-center gap-4">
                <span>Can I customize my subscription plan?</span>
                <span className="text-green-600 text-xl sm:text-2xl group-open:rotate-45 transition-transform flex-shrink-0">+</span>
              </summary>
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm sm:text-base text-gray-600 leading-relaxed">
                Yes! Our subscription plans are flexible. You can customize the vegetables you want, skip deliveries, pause your subscription, or cancel anytime without any charges.
              </div>
            </details>

            <details className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden group">
              <summary className="cursor-pointer p-4 sm:p-5 text-sm sm:text-base font-semibold text-gray-900 hover:bg-green-50 transition-colors flex justify-between items-center gap-4">
                <span>What payment methods do you accept?</span>
                <span className="text-green-600 text-xl sm:text-2xl group-open:rotate-45 transition-transform flex-shrink-0">+</span>
              </summary>
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm sm:text-base text-gray-600 leading-relaxed">
                Currently, we accept Cash on Delivery (COD) only. Pay in cash when your order is delivered to your doorstep. Online payment options will be available soon!
              </div>
            </details>

            <details className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden group">
              <summary className="cursor-pointer p-4 sm:p-5 text-sm sm:text-base font-semibold text-gray-900 hover:bg-green-50 transition-colors flex justify-between items-center gap-4">
                <span>What if I'm not satisfied with the quality?</span>
                <span className="text-green-600 text-xl sm:text-2xl group-open:rotate-45 transition-transform flex-shrink-0">+</span>
              </summary>
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm sm:text-base text-gray-600 leading-relaxed">
                We stand behind our products 100%. If you're not satisfied with the quality, contact us within 24 hours of delivery and we'll either replace the product or provide a full refund - no questions asked!
              </div>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Leaf, Heart, Users, Award, TrendingUp, MapPin } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-green-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">About Rural Bowl</h1>
          <p className="text-sm sm:text-base md:text-xl max-w-3xl mx-auto">
            Connecting you directly with the heart of rural farming communities
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-6">Our Story</h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4">
                Introduced in 2025, Rural Bowl began as a dedicated initiative to support local Farmer 
                Producer Organizations (FPOs) in rural communities. We recognized the challenges farmers 
                faced in reaching urban markets and the growing demand for fresh, authentic farm products.
              </p>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4">
                We procure all our products directly from FPOs, ensuring quality and authenticity. Our 
                platform connects customers with high-quality, farm-fresh vegetables and produce straight 
                from organized farmer collectives.
              </p>
              <p className="text-sm sm:text-base md:text-lg text-gray-600">
                Our mission is simple: bring the bounty of the countryside to your doorstep while 
                ensuring fair prices and sustainable livelihoods for our farming partners through 
                transparent FPO partnerships.
              </p>
            </div>
            <div className="relative h-96 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center">
                <span className="text-white text-6xl">🌾</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg mb-4 group-hover:scale-110 transition-transform">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">Sustainability</h3>
              <p className="text-sm sm:text-base text-gray-600">
                We promote eco-friendly farming practices and minimal environmental impact 
                throughout our supply chain.
              </p>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg mb-4 group-hover:scale-110 transition-transform">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">Fair Trade</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Farmers receive fair compensation for their hard work and high-quality products.
              </p>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-red-50 to-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-xl shadow-lg mb-4 group-hover:scale-110 transition-transform">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">Community</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Building strong relationships between rural producers and urban consumers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      {/* <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Sarah Johnson', role: 'Founder & CEO', emoji: '👩‍💼' },
              { name: 'Mike Chen', role: 'Head of Operations', emoji: '👨‍🌾' },
              { name: 'Emma Davis', role: 'Product Manager', emoji: '👩‍🔬' },
              { name: 'David Brown', role: 'Farmer Relations', emoji: '🤝' }
            ].map((member, index) => (
              <div key={index} className="text-center bg-white p-6 rounded-lg shadow-md">
                <div className="text-6xl mb-4">{member.emoji}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{member.name}</h3>
                <p className="text-green-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA */}
      <section className="py-16 bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Join Our Mission</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Every purchase supports rural communities and sustainable farming practices.
          </p>
          <div className="space-x-4">
            <a 
              href="/products" 
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
            >
              Shop Now
            </a>
            <a 
              href="/contact" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition duration-300"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
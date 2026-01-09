export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-green-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms and Conditions</h1>
          <p className="text-lg md:text-xl">Last updated: December 25, 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 md:p-12 space-y-8">
            {/* Introduction */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Agreement to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity 
                ("you") and Rural Bowl ("we," "us" or "our"), concerning your access to and use of the www.ruralbowl.com website as well as any 
                other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Site").
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                You agree that by accessing the Site, you have read, understood, and agree to be bound by all of these Terms and Conditions. 
                If you do not agree with all of these Terms and Conditions, then you are expressly prohibited from using the Site and you must 
                discontinue use immediately.
              </p>
            </div>

            {/* Account Registration */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Account Registration</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To use certain features of the Site, you may be required to register for an account. When you register for an account, you must:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Provide accurate, current and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and accept all risks of unauthorized access</li>
                <li>Immediately notify us of any unauthorized use of your account</li>
                <li>Be responsible for all activities that occur under your account</li>
              </ul>
            </div>

            {/* Products and Services */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Products and Services</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We make every effort to display as accurately as possible the colors, features, specifications, and details of the products available on the Site. 
                However, we do not guarantee that the colors, features, specifications, and details of the products will be accurate, complete, reliable, current, or free of other errors.
              </p>
              <p className="text-gray-600 leading-relaxed">
                All products are subject to availability. We reserve the right to discontinue any products at any time for any reason. 
                Prices for all products are subject to change without notice.
              </p>
            </div>

            {/* Orders and Payment */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Orders and Payment</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, 
                per household or per order. These restrictions may include orders placed by or under the same customer account, the same credit card, 
                and/or orders that use the same billing and/or shipping address.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">Payment methods accepted:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Credit/Debit Cards (Visa, Mastercard, RuPay)</li>
                <li>UPI (Google Pay, PhonePe, Paytm)</li>
                <li>Net Banking</li>
                <li>Wallets</li>
                <li>Cash on Delivery (where available)</li>
              </ul>
            </div>

            {/* Shipping and Delivery */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Shipping and Delivery</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We strive to deliver all products within the estimated delivery time mentioned at the time of ordering. However, delivery times may vary 
                due to factors beyond our control.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Delivery charges may apply based on your location and order value</li>
                <li>Free delivery is available on orders above a certain amount</li>
                <li>You must provide accurate delivery address information</li>
                <li>Risk of loss and title for products pass to you upon delivery</li>
                <li>We are not responsible for delays caused by incorrect addresses or unavailability at delivery location</li>
              </ul>
            </div>

            {/* Return and Refund Policy */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Return and Refund Policy</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We want you to be completely satisfied with your purchase. If you are not satisfied, we offer the following return and refund options:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li><strong>Fresh Produce:</strong> Returns accepted within 24 hours of delivery for quality issues with photographic proof</li>
                <li><strong>Packaged Products:</strong> Returns accepted within 7 days if unopened and in original condition</li>
                <li><strong>Damaged Products:</strong> Must be reported within 24 hours of delivery with photographic evidence</li>
                <li><strong>Refunds:</strong> Processed within 7-10 business days after approval</li>
                <li><strong>Non-returnable:</strong> Perishable items that have been used or opened (unless defective)</li>
              </ul>
            </div>

            {/* Prohibited Uses */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Prohibited Uses</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in 
                connection with any commercial endeavors except those that are specifically endorsed or approved by us. Prohibited uses include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Engaging in any automated use of the system</li>
                <li>Using the Site to advertise or offer to sell goods and services</li>
                <li>Making any unauthorized use of the Site</li>
                <li>Attempting to bypass any measures of the Site designed to prevent or restrict access</li>
                <li>Harassing, annoying, intimidating, or threatening any of our employees or agents</li>
                <li>Copying or adapting the Site's software</li>
                <li>Deciphering, decompiling, disassembling, or reverse engineering any of the software comprising the Site</li>
              </ul>
            </div>

            {/* Intellectual Property Rights */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Intellectual Property Rights</h2>
              <p className="text-gray-600 leading-relaxed">
                Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, 
                audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos 
                contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
              </p>
            </div>

            {/* Limitation of Liability */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                In no event will we or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, 
                exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from 
                your use of the Site, even if we have been advised of the possibility of such damages.
              </p>
            </div>

            {/* Governing Law */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Governing Law</h2>
              <p className="text-gray-600 leading-relaxed">
                These Terms and Conditions and your use of the Site are governed by and construed in accordance with the laws of India, 
                and you irrevocably submit to the exclusive jurisdiction of the courts in Chittoor, Andhra Pradesh.
              </p>
            </div>

            {/* Modifications */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Modifications to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, 
                we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be 
                determined at our sole discretion. By continuing to access or use our Site after any revisions become effective, you agree 
                to be bound by the revised terms.
              </p>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact Us</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about these Terms and Conditions, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg space-y-2">
                <p className="text-gray-600"><strong>Email:</strong> legal@ruralbowl.com</p>
                <p className="text-gray-600"><strong>Phone:</strong> +91 8919337449</p>
                <p className="text-gray-600"><strong>Address:</strong> Chittoor, Andhra Pradesh, India</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

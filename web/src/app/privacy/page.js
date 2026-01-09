export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-green-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg md:text-xl">Last updated: December 25, 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 md:p-12 space-y-8">
            {/* Introduction */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                Welcome to Rural Bowl. We respect your privacy and are committed to protecting your personal data. 
                This privacy policy will inform you about how we look after your personal data when you visit our 
                website and tell you about your privacy rights and how the law protects you.
              </p>
            </div>

            {/* Information We Collect */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Information We Collect</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may collect, use, store and transfer different kinds of personal data about you:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li><strong>Identity Data:</strong> First name, last name, username or similar identifier</li>
                <li><strong>Contact Data:</strong> Billing address, delivery address, email address and telephone numbers</li>
                <li><strong>Financial Data:</strong> Bank account and payment card details</li>
                <li><strong>Transaction Data:</strong> Details about payments to and from you and other details of products and services you have purchased from us</li>
                <li><strong>Technical Data:</strong> Internet protocol (IP) address, browser type and version, time zone setting, browser plug-in types and versions, operating system and platform</li>
                <li><strong>Profile Data:</strong> Your username and password, purchases or orders made by you, your interests, preferences, feedback and survey responses</li>
                <li><strong>Usage Data:</strong> Information about how you use our website, products and services</li>
                <li><strong>Marketing and Communications Data:</strong> Your preferences in receiving marketing from us and your communication preferences</li>
              </ul>
            </div>

            {/* How We Use Your Information */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>To process and deliver your orders including managing payments, fees and charges</li>
                <li>To manage our relationship with you including notifying you about changes to our terms or privacy policy</li>
                <li>To enable you to complete a survey or participate in a competition or promotion</li>
                <li>To administer and protect our business and this website including troubleshooting, data analysis, testing, system maintenance, support, reporting and hosting of data</li>
                <li>To deliver relevant website content and advertisements to you and measure or understand the effectiveness of the advertising we serve to you</li>
                <li>To use data analytics to improve our website, products/services, marketing, customer relationships and experiences</li>
                <li>To make suggestions and recommendations to you about goods or services that may be of interest to you</li>
              </ul>
            </div>

            {/* Data Security */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Data Security</h2>
              <p className="text-gray-600 leading-relaxed">
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
                used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal 
                data to those employees, agents, contractors and other third parties who have a business need to know.
              </p>
            </div>

            {/* Data Retention */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Data Retention</h2>
              <p className="text-gray-600 leading-relaxed">
                We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, 
                including for the purposes of satisfying any legal, accounting, or reporting requirements. To determine the 
                appropriate retention period for personal data, we consider the amount, nature, and sensitivity of the personal data, 
                the potential risk of harm from unauthorized use or disclosure of your personal data, the purposes for which we 
                process your personal data and whether we can achieve those purposes through other means, and the applicable legal requirements.
              </p>
            </div>

            {/* Your Legal Rights */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Legal Rights</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Under certain circumstances, you have rights under data protection laws in relation to your personal data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li><strong>Request access</strong> to your personal data</li>
                <li><strong>Request correction</strong> of your personal data</li>
                <li><strong>Request erasure</strong> of your personal data</li>
                <li><strong>Object to processing</strong> of your personal data</li>
                <li><strong>Request restriction</strong> of processing your personal data</li>
                <li><strong>Request transfer</strong> of your personal data</li>
                <li><strong>Right to withdraw consent</strong></li>
              </ul>
            </div>

            {/* Cookies */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Cookies</h2>
              <p className="text-gray-600 leading-relaxed">
                Our website uses cookies to distinguish you from other users of our website. This helps us to provide you with a 
                good experience when you browse our website and also allows us to improve our site. A cookie is a small file of 
                letters and numbers that we store on your browser or the hard drive of your computer if you agree. Cookies contain 
                information that is transferred to your computer's hard drive.
              </p>
            </div>

            {/* Third-Party Links */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Third-Party Links</h2>
              <p className="text-gray-600 leading-relaxed">
                This website may include links to third-party websites, plug-ins and applications. Clicking on those links or 
                enabling those connections may allow third parties to collect or share data about you. We do not control these 
                third-party websites and are not responsible for their privacy statements. When you leave our website, we encourage 
                you to read the privacy policy of every website you visit.
              </p>
            </div>

            {/* Contact Us */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact Us</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about this privacy policy or our privacy practices, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg space-y-2">
                <p className="text-gray-600"><strong>Email:</strong> privacy@ruralbowl.com</p>
                <p className="text-gray-600"><strong>Phone:</strong> +91 8919337449</p>
                <p className="text-gray-600"><strong>Address:</strong> Chittoor, Andhra Pradesh, India</p>
              </div>
            </div>

            {/* Changes to Privacy Policy */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Changes to This Privacy Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update our privacy policy from time to time. We will notify you of any changes by posting the new privacy 
                policy on this page and updating the "Last updated" date at the top of this privacy policy. You are advised to 
                review this privacy policy periodically for any changes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

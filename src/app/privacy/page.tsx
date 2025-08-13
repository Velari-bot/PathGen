'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col">
      <Navbar />
      
      {/* Main Content */}
      <div className="flex-1 relative z-10 max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="text-primary-text">Privacy</span>
            <br />
            <span className="text-gradient">Policy</span>
          </h1>
          <p className="text-xl text-secondary-text">
            How we protect and handle your information
          </p>
        </div>

        {/* Policy Content */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">PathGen Privacy Policy</h2>
            <p className="text-secondary-text">Effective Date: 12/8/2025</p>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-secondary-text mb-6">
              PathGen ("we," "our," "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website, application, and related services (collectively, the "Service").
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">1. Information We Collect</h3>
            <p className="text-secondary-text mb-4">
              We may collect the following types of information when you use PathGen:
            </p>
            <ul className="text-secondary-text mb-6 space-y-2 ml-6">
              <li><strong>Account Information:</strong> Username, email address, password, and linked gaming accounts (e.g., Fortnite Tracker, Epic Games).</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent in the app, and other analytical data.</li>
              <li><strong>Gameplay Data:</strong> Game statistics, match history, and performance metrics obtained via APIs you authorize.</li>
              <li><strong>Device & Technical Data:</strong> IP address, browser type, operating system, and device identifiers.</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-4">2. How We Use Your Information</h3>
            <p className="text-secondary-text mb-4">
              We use the collected information to:
            </p>
            <ul className="text-secondary-text mb-6 space-y-2 ml-6">
              <li>Provide, maintain, and improve our Service.</li>
              <li>Personalize user experiences and game insights.</li>
              <li>Connect with third-party APIs to fetch and display your stats.</li>
              <li>Process payments (if applicable).</li>
              <li>Detect and prevent fraud or misuse.</li>
              <li>Communicate with you about updates, offers, or support.</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-4">3. Sharing Your Information</h3>
            <p className="text-secondary-text mb-4">
              We do not sell your personal data. We may share your information only in these cases:
            </p>
            <ul className="text-secondary-text mb-6 space-y-2 ml-6">
              <li>With your consent (e.g., linking a gaming account).</li>
              <li>With service providers who help operate our platform (e.g., hosting, analytics, payment processing).</li>
              <li>For legal reasons if required by law, court order, or to protect rights and safety.</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-4">4. Data Retention</h3>
            <p className="text-secondary-text mb-6">
              We retain your information as long as your account is active or as needed to provide the Service. You may request deletion at any time by contacting us at <a href="mailto:support@lunery.xyz" className="text-blue-400 hover:text-blue-300">support@lunery.xyz</a>.
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">5. Your Rights</h3>
            <p className="text-secondary-text mb-4">
              Depending on your location, you may have the right to:
            </p>
            <ul className="text-secondary-text mb-6 space-y-2 ml-6">
              <li>Access, update, or delete your personal data.</li>
              <li>Withdraw consent to data processing.</li>
              <li>Request a copy of your stored data.</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-4">6. Security</h3>
            <p className="text-secondary-text mb-6">
              We use industry-standard encryption and security measures to protect your data. However, no method of transmission or storage is 100% secure.
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">7. Third-Party Services</h3>
            <p className="text-secondary-text mb-6">
              PathGen may integrate with third-party APIs (e.g., Fortnite Tracker) to fetch game-related data. Your use of these features is subject to the third-party's privacy policy.
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">8. Children's Privacy</h3>
            <p className="text-secondary-text mb-6">
              Our Service is not directed to anyone under the age of 13. We do not knowingly collect personal information from children.
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">9. Changes to This Policy</h3>
            <p className="text-secondary-text mb-6">
              We may update this Privacy Policy from time to time. Changes will be posted here with an updated effective date.
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">10. Contact Us</h3>
            <p className="text-secondary-text mb-4">
              If you have questions about this Privacy Policy, contact us at:
            </p>
            <div className="bg-white/10 border border-white/20 rounded-lg p-4 text-center">
              <a 
                href="mailto:support@lunery.xyz"
                className="text-xl font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-300"
              >
                support@lunery.xyz
              </a>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/help"
            className="px-8 py-3 bg-white/10 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors duration-300"
          >
            Help Center
          </Link>
          <Link 
            href="/contact"
            className="px-8 py-3 bg-white/10 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors duration-300"
          >
            Contact Us
          </Link>
          <Link 
            href="/"
            className="px-8 py-3 bg-white/10 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors duration-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

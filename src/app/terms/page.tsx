'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col">
      <Navbar />
      
      {/* Main Content */}
      <div className="flex-1 relative z-10 max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="text-primary-text">Terms of</span>
            <br />
            <span className="text-gradient">Service</span>
          </h1>
          <p className="text-xl text-secondary-text">
            Please read these terms carefully before using PathGen
          </p>
        </div>

        {/* Terms Content */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">PathGen Terms of Service</h2>
            <p className="text-secondary-text">Effective Date: 12/8/2025</p>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-secondary-text mb-6">
              These Terms of Service ("Terms") govern your use of PathGen ("Service") operated by PathGen ("we," "us," or "our"). By accessing or using our Service, you agree to be bound by these Terms.
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h3>
            <p className="text-secondary-text mb-6">
              By accessing or using PathGen, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">2. Description of Service</h3>
            <p className="text-secondary-text mb-4">
              PathGen is an AI-powered Fortnite improvement coaching platform that provides:
            </p>
            <ul className="text-secondary-text mb-6 space-y-2 ml-6">
              <li>Personalized gaming advice and coaching</li>
              <li>Fortnite performance analysis and statistics</li>
              <li>AI-powered gameplay improvement suggestions</li>
              <li>Integration with third-party gaming APIs</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-4">3. User Accounts</h3>
            <p className="text-secondary-text mb-4">
              When you create an account with us, you must provide accurate and complete information. You are responsible for:
            </p>
            <ul className="text-secondary-text mb-6 space-y-2 ml-6">
              <li>Maintaining the security of your account and password</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Ensuring your account information is accurate and up-to-date</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-4">4. Acceptable Use</h3>
            <p className="text-secondary-text mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="text-secondary-text mb-6 space-y-2 ml-6">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Upload malicious code or attempt to gain unauthorized access</li>
              <li>Use the Service for commercial purposes without permission</li>
              <li>Attempt to reverse engineer or modify the Service</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-4">5. Privacy and Data</h3>
            <p className="text-secondary-text mb-6">
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices regarding the collection and use of your information.
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">6. Third-Party Services</h3>
            <p className="text-secondary-text mb-4">
              Our Service may integrate with third-party services, including:
            </p>
            <ul className="text-secondary-text mb-6 space-y-2 ml-6">
              <li>Epic Games (for account authentication)</li>
              <li>Fortnite Tracker (for gaming statistics)</li>
              <li>OpenAI (for AI coaching features)</li>
            </ul>
            <p className="text-secondary-text mb-6">
              Your use of these third-party services is subject to their respective terms of service and privacy policies.
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">7. Intellectual Property</h3>
            <p className="text-secondary-text mb-6">
              The Service and its original content, features, and functionality are and will remain the exclusive property of PathGen and its licensors. The Service is protected by copyright, trademark, and other laws.
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">8. Disclaimers</h3>
            <p className="text-secondary-text mb-4">
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties:
            </p>
            <ul className="text-secondary-text mb-6 space-y-2 ml-6">
              <li>That the Service will meet your specific requirements</li>
              <li>That the Service will be uninterrupted or error-free</li>
              <li>That the results obtained from using the Service will be accurate or reliable</li>
              <li>That the quality of any products, services, or information obtained through the Service will meet your expectations</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-4">9. Limitation of Liability</h3>
            <p className="text-secondary-text mb-6">
              In no event shall PathGen, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">10. Termination</h3>
            <p className="text-secondary-text mb-6">
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">11. Changes to Terms</h3>
            <p className="text-secondary-text mb-6">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">12. Governing Law</h3>
            <p className="text-secondary-text mb-6">
              These Terms shall be interpreted and governed by the laws of the jurisdiction in which PathGen operates, without regard to its conflict of law provisions.
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">13. Contact Information</h3>
            <p className="text-secondary-text mb-4">
              If you have any questions about these Terms of Service, please contact us at:
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
            href="/privacy"
            className="px-8 py-3 bg-white/10 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors duration-300"
          >
            Privacy Policy
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

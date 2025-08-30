'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function ContactUs() {

  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col">
      <Navbar />
      
      {/* Main Content */}
      <div className="flex-1 relative z-10 max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="text-primary-text">Contact</span>
            <br />
            <span className="text-gradient">Us</span>
          </h1>
          <p className="text-xl text-secondary-text">
            Get in touch with our support team. We're here to help!
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Email Support */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">📧</div>
            <h3 className="text-2xl font-semibold text-white mb-4">Email Support</h3>
            <p className="text-secondary-text mb-6">
              For immediate assistance, email us directly at:
            </p>
            <a 
              href="mailto:support@lunery.xyz"
              className="text-xl font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-300"
            >
              support@lunery.xyz
            </a>
            <p className="text-sm text-secondary-text mt-4">
              We typically respond within 24 hours
            </p>
          </div>

          {/* Response Time */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">⏱️</div>
            <h3 className="text-2xl font-semibold text-white mb-4">Response Time</h3>
            <div className="space-y-3 text-secondary-text">
              <div className="flex justify-between">
                <span>General Questions:</span>
                <span className="text-green-400">24 hours</span>
              </div>
              <div className="flex justify-between">
                <span>Technical Issues:</span>
                <span className="text-yellow-400">12 hours</span>
              </div>
              <div className="flex justify-between">
                <span>Urgent Problems:</span>
                <span className="text-red-400">4 hours</span>
              </div>
            </div>
          </div>
        </div>



        {/* Additional Support Options */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Other Ways to Get Help</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/help" className="text-center p-4 hover:bg-white/5 rounded-lg transition-colors duration-300">
              <div className="text-3xl mb-2">❓</div>
              <h3 className="text-lg font-semibold text-white mb-2">Help Center</h3>
              <p className="text-secondary-text text-sm">Browse FAQs and troubleshooting guides</p>
            </Link>
            
            <div className="text-center p-4">
                              <div className="text-3xl mb-2">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
              <h3 className="text-lg font-semibold text-white mb-2">Documentation</h3>
              <p className="text-secondary-text text-sm">Coming soon - detailed guides and tutorials</p>
            </div>
            
            <div className="text-center p-4">
              <div className="text-3xl mb-2">💬</div>
              <h3 className="text-lg font-semibold text-white mb-2">Support</h3>
              <p className="text-secondary-text text-sm">Join our Discord for support and updates</p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link 
            href="/"
            className="px-8 py-3 bg-white/10 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors duration-300"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

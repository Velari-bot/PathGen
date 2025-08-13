'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function HelpCenter() {
  const faqs = [
    {
      question: "How do I connect my Fortnite account?",
      answer: "You can connect your Fortnite account in three ways: 1) Epic Account OAuth (recommended), 2) Manual username input, or 3) Fortnite Tracker link. Go to the AI page and select your preferred method."
    },
    {
      question: "Why can't I see my Fortnite stats?",
      answer: "If the Fortnite Tracker API is blocked, you can enter your stats manually. Look for the 'Manual Input' option and enter your K/D ratio, win rate, matches played, and average placement."
    },
    {
      question: "How does the AI coaching work?",
      answer: "PathGen AI analyzes your Fortnite performance data and provides personalized advice. The AI considers your specific stats like K/D ratio, win rate, and match history to give targeted improvement tips."
    },
    {
      question: "Can I use PathGen without an account?",
      answer: "Yes! You can use the basic features without creating an account, but linking your Epic account or entering stats manually will provide personalized AI coaching."
    },
    {
      question: "How many chats can I have?",
      answer: "You can have up to 5 active chats at once. Old chats automatically expire after 30 days to keep your experience organized."
    },
    {
      question: "Is my data secure?",
      answer: "Yes! We use industry-standard encryption and never sell your personal data. Your gaming stats are only used to provide personalized coaching."
    }
  ];

  const troubleshooting = [
    {
      issue: "AI not responding to messages",
      solution: "Try clicking 'New Chat' to start a fresh conversation. Also check if your stats are properly saved by clicking the 'Save Stats' button."
    },
    {
      issue: "Stats not showing up",
      solution: "Ensure you've entered your username correctly or try the manual input method. Check the console for any error messages."
    },
    {
      issue: "Page not loading properly",
      solution: "Refresh the page and clear your browser cache. Make sure you're using a modern browser like Chrome, Firefox, or Edge."
    },
    {
      issue: "Can't connect Epic account",
      solution: "Try logging out and back in, or use the manual username input method instead. The Epic OAuth is optional for basic functionality."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col">
      <Navbar />
      
      {/* Main Content */}
      <div className="flex-1 relative z-10 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="text-primary-text">Help</span>
            <br />
            <span className="text-gradient">Center</span>
          </h1>
          <p className="text-xl text-secondary-text">
            Get help with PathGen and find answers to common questions
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Link href="#faq" className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
            <h3 className="text-xl font-semibold text-white mb-2">❓ FAQ</h3>
            <p className="text-secondary-text">Find answers to frequently asked questions</p>
          </Link>
          
          <Link href="#troubleshooting" className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
            <h3 className="text-xl font-semibold text-white mb-2">🔧 Troubleshooting</h3>
            <p className="text-secondary-text">Common issues and their solutions</p>
          </Link>
          
          <Link href="/contact" className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
            <h3 className="text-xl font-semibold text-white mb-2">📧 Contact Support</h3>
            <p className="text-secondary-text">Get in touch with our support team</p>
          </Link>
        </div>

        {/* FAQ Section */}
        <section id="faq" className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3">{faq.question}</h3>
                <p className="text-secondary-text leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Troubleshooting Section */}
        <section id="troubleshooting" className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Troubleshooting</h2>
          <div className="space-y-6">
            {troubleshooting.map((item, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-2">Issue: {item.issue}</h3>
                <p className="text-secondary-text leading-relaxed"><span className="text-green-400">Solution:</span> {item.solution}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Getting Started Guide */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Getting Started</h2>
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">🚀 Quick Start</h3>
                <ol className="text-secondary-text space-y-2">
                  <li>1. Go to the AI page</li>
                  <li>2. Choose your input method (Epic Account, Manual, or Tracker)</li>
                  <li>3. Enter your Fortnite username or stats</li>
                  <li>4. Start chatting with the AI for personalized coaching!</li>
                </ol>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">💡 Pro Tips</h3>
                <ul className="text-secondary-text space-y-2">
                  <li>• Use manual input if APIs are blocked</li>
                  <li>• Save your stats before asking questions</li>
                  <li>• Try different question types for varied advice</li>
                  <li>• Check the chat log to review past conversations</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="text-center">
          <div className="bg-white/5 border border-white/10 rounded-xl p-8">
            <h3 className="text-2xl font-semibold text-white mb-4">Still Need Help?</h3>
            <p className="text-secondary-text mb-6">
              Can't find what you're looking for? Our support team is here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/contact"
                className="px-8 py-3 bg-white text-dark-charcoal rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300"
              >
                Contact Support
              </Link>
              <Link 
                href="/"
                className="px-8 py-3 bg-white/10 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors duration-300"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </div>
      
      <Footer />
    </div>
  );
}

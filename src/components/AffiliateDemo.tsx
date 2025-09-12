'use client';

import { useState, useEffect } from 'react';
import { getStoredReferralCode } from './ReferralTracker';

/**
 * Demo component to show affiliate system in action
 */
export default function AffiliateDemo() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isAffiliate, setIsAffiliate] = useState(false);

  useEffect(() => {
    // Check if user came from affiliate link
    const storedCode = getStoredReferralCode();
    setReferralCode(storedCode);
  }, []);

  const simulateAffiliateClick = () => {
    // Simulate clicking an affiliate link
    const testCode = 'DEMO123';
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('ref', testCode);
    
    // Reload page with referral parameter
    window.location.href = currentUrl.toString();
  };

  const createCheckoutWithReferral = async () => {
    const storedReferral = getStoredReferralCode();
    
    console.log('Creating checkout with referral:', storedReferral);
    
    // This would call your actual checkout API
    const response = await fetch('/api/affiliate/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: 'price_1RvsvqCitWuvPenEw9TefOig', // Your Pro price ID
        userId: 'demo_user',
        referralCode: storedReferral
      })
    });
    
    const result = await response.json();
    console.log('Checkout result:', result);
    
    if (result.url) {
      window.location.href = result.url;
    }
  };

  const becomeAffiliate = async () => {
    try {
      const response = await fetch('/api/affiliate/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo_user_' + Date.now(),
          email: 'demo@example.com',
          displayName: 'Demo User',
          paymentMethod: 'paypal',
          paymentDetails: 'demo@paypal.com'
        })
      });
      
      const result = await response.json();
      console.log('Affiliate registration result:', result);
      
      if (result.success) {
        alert(`Your referral link: ${result.referralUrl}`);
        setIsAffiliate(true);
      }
    } catch (error) {
      console.error('Error becoming affiliate:', error);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-4">🤝 Affiliate System Demo</h3>
      
      {referralCode ? (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">
            ✅ You came from affiliate: <strong>{referralCode}</strong>
          </p>
          <p className="text-sm text-green-600">
            They'll earn 15% when you subscribe!
          </p>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
          <p className="text-gray-600">No referral code detected</p>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={simulateAffiliateClick}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🔗 Simulate Affiliate Link Click
        </button>

        <button
          onClick={createCheckoutWithReferral}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          💳 Buy Pro (with referral tracking)
        </button>

        <button
          onClick={becomeAffiliate}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          🤝 Become an Affiliate
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p><strong>How it works:</strong></p>
        <p>1. Click affiliate link → Code stored for 30 days</p>
        <p>2. Purchase Pro → Affiliate gets 15% commission</p>
        <p>3. Track performance in affiliate dashboard</p>
      </div>
    </div>
  );
}

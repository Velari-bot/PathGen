'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import AIShowcaseSection from '@/components/AIShowcaseSection';
import PersonaSelector from '@/components/PersonaSelector';
import InteractiveDemo from '@/components/InteractiveDemo';
import CommunitySection from '@/components/CommunitySection';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Handle Epic OAuth callback if this page is loaded with OAuth parameters
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (code && state && user) {
      console.log('Epic OAuth callback detected on home page, redirecting to test page...');
      // Redirect to test page with OAuth parameters
      router.push(`/test-osirion-api?code=${code}&state=${state}`);
    } else if (error) {
      console.error('Epic OAuth error on home page:', error);
      // Redirect to test page with error
      router.push(`/test-osirion-api?error=${error}`);
    }
  }, [searchParams, user, router]);

  return (
    <SmoothScroll>
      <main className="scroll-snap-y bg-primary-bg text-primary-text overflow-hidden mobile-container">
        <Navbar />
        <div className="pt-14 sm:pt-16"> {/* Account for fixed navbar height */}
          <HeroSection />
          <AIShowcaseSection />
          <InteractiveDemo />
          <CommunitySection />
          <PersonaSelector />
        </div>
        <Footer />
      </main>
    </SmoothScroll>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-primary-bg flex items-center justify-center">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}

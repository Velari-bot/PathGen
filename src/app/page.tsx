'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import AIShowcaseSection from '@/components/AIShowcaseSection';
import PersonaSelector from '@/components/PersonaSelector';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';

export default function HomePage() {
  return (
    <SmoothScroll>
      <main className="scroll-snap-y bg-primary-bg text-primary-text overflow-hidden">
        <Navbar />
        <HeroSection />
        <AIShowcaseSection />
        <PersonaSelector />
        <Footer />
      </main>
    </SmoothScroll>
  );
}

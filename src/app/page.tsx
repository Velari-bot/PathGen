'use client';

import React, { useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import AIShowcaseSection from '@/components/AIShowcaseSection';
import PersonaSelector from '@/components/PersonaSelector';
import Footer from '@/components/Footer';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HomePage() {
  useGSAP(() => {
    // Initialize Lenis for ultra-smooth scrolling
    const lenis = new Lenis({
      duration: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    // Connect Lenis to GSAP ScrollTrigger for perfect synchronization
    lenis.on('scroll', ScrollTrigger.update);

    // Use requestAnimationFrame for optimal performance
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    // Disable GSAP ticker lag smoothing for better performance
    gsap.ticker.lagSmoothing(0);

    // Add smooth scroll behavior to all internal links
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    smoothScrollLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href') || '') as HTMLElement;
        if (target) {
          lenis.scrollTo(target, { duration: 2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
        }
      });
    });

    // Cleanup function
    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <main className="scroll-snap-y bg-primary-bg text-primary-text overflow-hidden">
      <Navbar />
      <HeroSection />
      <AIShowcaseSection />
      <PersonaSelector />
      <Footer />
    </main>
  );
}

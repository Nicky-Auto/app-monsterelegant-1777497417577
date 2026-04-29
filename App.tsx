'use client';
import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import AIDesigner from './components/AIDesigner';
import FeaturedProducts from './components/FeaturedProducts';
import OrderTracking from './components/OrderTracking';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';

export default function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [activePage, setActivePage] = useState('home');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Header onAuthOpen={() => setAuthOpen(true)} activePage={activePage} setActivePage={setActivePage} />
      {activePage === 'home' && (
        <>
          <Hero setActivePage={setActivePage} />
          <HowItWorks />
          <AIDesigner onAuthOpen={() => setAuthOpen(true)} />
          <FeaturedProducts setActivePage={setActivePage} />
          <OrderTracking />
        </>
      )}
      {activePage === 'designer' && <AIDesigner onAuthOpen={() => setAuthOpen(true)} fullPage />}
      {activePage === 'tracking' && <OrderTracking fullPage />}
      <Footer />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
'use client';
import React from 'react';
import { Sparkles, ArrowRight, Zap, Star } from 'lucide-react';

interface HeroProps {
  setActivePage: (page: string) => void;
}

export default function Hero({ setActivePage }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0">
        <img
          src={`https://loremflickr.com/1600/900/fashion?lock=10`}
          alt="Hero fashion"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-[#0a0a0a]/40 to-[#0a0a0a]" />
      </div>

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-white/80 mb-8 backdrop-blur-sm">
          <Zap size={14} className="text-rose-400" />
          Diseños únicos con Inteligencia Artificial
          <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-ping" />
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
          <span className="text-white">Tu moda,</span>
          <br />
          <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
            creada por IA
          </span>
        </h1>

        <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
          Describe la prenda de tus sueños y nuestra IA la diseñará en segundos.
          Elige tu tela, color y talla. Nosotros la confeccionamos para ti.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => setActivePage('designer')}
            className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-lg hover:shadow-2xl hover:shadow-rose-500/30 hover:scale-105 transition-all duration-300"
          >
            <Sparkles size={20} />
            Diseñar mi Prenda
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => setActivePage('collections')}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/20 text-white/80 font-medium hover:bg-white/5 hover:border-white/40 transition-all"
          >
            Ver Colecciones
          </button>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          {[
            { value: '2.400+', label: 'Diseños creados' },
            { value: '98%', label: 'Clientas felices' },
            { value: '4.9', label: 'Valoración', icon: <Star size={12} className="text-yellow-400 fill-yellow-400" /> },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-black text-white">
                {stat.icon}{stat.value}
              </div>
              <div className="text-xs text-white/40 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
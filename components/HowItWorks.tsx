import React from 'react';
import { MessageSquare, Sparkles, Palette, ShoppingBag } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: <MessageSquare size={24} />,
      number: '01',
      title: 'Describe tu prenda',
      desc: 'Escribe en lenguaje natural cómo imaginas tu prenda ideal. Mangas, estilo, largo, detalles...',
      color: 'from-rose-500 to-pink-500',
    },
    {
      icon: <Sparkles size={24} />,
      number: '02',
      title: 'IA genera el diseño',
      desc: 'En segundos, nuestra IA crea un preview visual realista de tu prenda personalizada.',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      icon: <Palette size={24} />,
      number: '03',
      title: 'Personaliza los detalles',
      desc: 'Elige la tela, el color exacto y tu talla. Todo configurado a tu medida.',
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: <ShoppingBag size={24} />,
      number: '04',
      title: 'Realiza tu pedido',
      desc: 'Paga de forma segura con tarjeta, PayPal o transferencia. ¡Y nosotros lo confeccionamos!',
      color: 'from-indigo-500 to-purple-500',
    },
  ];

  return (
    <section className="py-24 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-widest text-rose-400 uppercase mb-3 block">Proceso Simple</span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            ¿Cómo funciona?
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            De tu imaginación a tu armario en 4 sencillos pasos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-white/20 to-transparent z-10" />
              )}
              <div className="relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/8 transition-all duration-300 group-hover:-translate-y-1">
                <div className="absolute top-4 right-4 text-5xl font-black text-white/5">{step.number}</div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                  {step.icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
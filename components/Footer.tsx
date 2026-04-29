import React from 'react';
import { Sparkles, Instagram, Twitter, Facebook, Mail, Phone, MapPin, CreditCard, Shield, Truck } from 'lucide-react';

export default function Footer() {
  const footerLinks = {
    Comprar: ['Nueva Colección', 'Diseñar con IA', 'Más Vendidos', 'Ofertas'],
    Ayuda: ['Guía de Tallas', 'Política de Envíos', 'Devoluciones', 'FAQ'],
    Empresa: ['Nuestra Historia', 'Sostenibilidad', 'Blog de Moda', 'Trabaja con Nosotras'],
  };

  const paymentIcons = [
    { label: 'Visa', bg: 'bg-blue-600' },
    { label: 'Mastercard', bg: 'bg-red-600' },
    { label: 'PayPal', bg: 'bg-blue-400' },
    { label: 'Transfer', bg: 'bg-green-600' },
  ];

  return (
    <footer className="bg-[#050505] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
                <Sparkles size={17} className="text-white" />
              </div>
              <span className="text-xl font-black">
                <span className="text-white">Monster</span>
                <span className="bg-gradient-to-r from-rose-400 to-purple-500 bg-clip-text text-transparent">Elegant</span>
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-xs">
              Moda femenina personalizada potenciada por Inteligencia Artificial.
              Tu prenda única, diseñada por ti, confeccionada por nosotras.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-white/40 text-sm">
                <Mail size={14} />
                hola@monsterelegant.com
              </div>
              <div className="flex items-center gap-2.5 text-white/40 text-sm">
                <Phone size={14} />
                +34 900 123 456
              </div>
              <div className="flex items-center gap-2.5 text-white/40 text-sm">
                <MapPin size={14} />
                Madrid, España
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-bold text-sm mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link}>
                    <button className="text-white/40 hover:text-white text-sm transition-all">
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-white/30 text-xs">
                <Shield size={14} className="text-green-400" />
                Pago 100% Seguro
              </div>
              <div className="flex items-center gap-2 text-white/30 text-xs">
                <Truck size={14} className="text-purple-400" />
                Envío a todo el mundo
              </div>
              <div className="flex items-center gap-2 text-white/30 text-xs">
                <CreditCard size={14} className="text-rose-400" />
                Múltiples métodos de pago
              </div>
            </div>

            <div className="flex items-center gap-2">
              {paymentIcons.map(p => (
                <div
                  key={p.label}
                  className={`${p.bg} px-2.5 py-1.5 rounded-md text-white text-xs font-bold opacity-70`}
                >
                  {p.label}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-white/20 text-xs">
            © 2025 MonsterElegant. Todos los derechos reservados.
            <span className="mx-2">·</span>
            Diseñado con IA y ❤️
          </div>
        </div>
      </div>
    </footer>
  );
}
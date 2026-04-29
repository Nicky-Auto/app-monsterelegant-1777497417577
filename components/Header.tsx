'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, ShoppingBag, Globe, Menu, X, User, ChevronDown } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { getCartItemCount } from '../actions/orders';
import { signOut } from '../actions/auth';

const SUPABASE_URL = typeof window !== 'undefined'
  ? (window as any).__NEXT_DATA__?.runtimeConfig?.NEXT_PUBLIC_SUPABASE_URL ?? ''
  : '';

interface HeaderProps {
  onAuthOpen: () => void;
  activePage: string;
  setActivePage: (page: string) => void;
}

export default function Header({ onAuthOpen, activePage, setActivePage }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState('ES');
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');

  useEffect(() => {
    setSupabaseUrl((import.meta as any).env?.VITE_SUPABASE_URL ?? '');
    setSupabaseKey((import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? '');
  }, []);

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  }, [supabaseUrl, supabaseKey]);

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email ?? '');
        const count = await getCartItemCount();
        setCartCount(count);
      } else {
        setIsLoggedIn(false);
        setUserEmail('');
        setCartCount(0);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email ?? '');
        const count = await getCartItemCount();
        setCartCount(count);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await signOut();
    setIsLoggedIn(false);
    setUserEmail('');
    setCartCount(0);
    setUserMenuOpen(false);
    setActivePage('home');
  };

  const navLinks = [
    { label: 'Inicio', key: 'home' },
    { label: 'Diseñar Prenda', key: 'designer' },
    { label: 'Colecciones', key: 'collections' },
    { label: 'Seguir Pedido', key: 'tracking' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => setActivePage('home')} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-white">Monster</span>
              <span className="bg-gradient-to-r from-rose-400 to-purple-500 bg-clip-text text-transparent">Elegant</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <button
                key={link.key}
                onClick={() => setActivePage(link.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activePage === link.key
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 text-sm transition-all"
              >
                <Globe size={15} />
                <span>{lang}</span>
                <ChevronDown size={13} />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                  {['ES', 'EN'].map(l => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setLangOpen(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
                    >
                      {l === 'ES' ? '🇪🇸 Español' : '🇺🇸 English'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isLoggedIn ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all border border-white/10"
                >
                  <User size={15} />
                  <span className="max-w-[100px] truncate">{userEmail.split('@')[0]}</span>
                  <ChevronDown size={13} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    <button
                      onClick={() => { setActivePage('tracking'); setUserMenuOpen(false); }}
                      className="w-full px-4 py-3 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
                    >
                      Mis Pedidos
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-3 text-left text-sm text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onAuthOpen}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all border border-white/10"
              >
                <User size={15} />
                Acceder
              </button>
            )}

            <button className="relative p-2 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 hover:opacity-90 transition-all">
              <ShoppingBag size={18} className="text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-[#0a0a0a] rounded-full text-[10px] font-bold flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-white/60 hover:text-white">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#111] border-t border-white/10 px-4 py-4 space-y-1">
          {navLinks.map(link => (
            <button
              key={link.key}
              onClick={() => { setActivePage(link.key); setMenuOpen(false); }}
              className="block w-full text-left px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 text-sm transition-all"
            >
              {link.label}
            </button>
          ))}
          {isLoggedIn ? (
            <button
              onClick={handleSignOut}
              className="w-full mt-2 px-4 py-3 rounded-xl border border-rose-500/30 text-rose-400 text-sm font-semibold"
            >
              Cerrar Sesión
            </button>
          ) : (
            <button
              onClick={() => { onAuthOpen(); setMenuOpen(false); }}
              className="w-full mt-2 px-4 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white text-sm font-semibold"
            >
              Iniciar Sesión / Registrarse
            </button>
          )}
        </div>
      )}
    </header>
  );
}
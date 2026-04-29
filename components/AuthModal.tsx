'use client';
import React, { useState, useTransition } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles, Chrome } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } from '../actions/auth';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    startTransition(async () => {
      if (showForgot) {
        const result = await resetPassword(email);
        if (result.success) {
          setSuccessMsg('Te hemos enviado un enlace para restablecer tu contraseña.');
        } else {
          setErrorMsg(result.error ?? 'Error al enviar el email.');
        }
        return;
      }

      if (isLogin) {
        const result = await signInWithEmail(email, password);
        if (result.success) {
          setSuccessMsg('¡Bienvenida de vuelta!');
          setTimeout(() => onClose(), 800);
        } else {
          setErrorMsg(result.error ?? 'Error al iniciar sesión.');
        }
      } else {
        if (!fullName.trim()) {
          setErrorMsg('Por favor, introduce tu nombre completo.');
          return;
        }
        const result = await signUpWithEmail(email, password, fullName);
        if (result.success) {
          setSuccessMsg('¡Cuenta creada! Revisa tu email para confirmar tu registro.');
        } else {
          setErrorMsg(result.error ?? 'Error al crear la cuenta.');
        }
      }
    });
  };

  const handleGoogle = () => {
    startTransition(async () => {
      const result = await signInWithGoogle();
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        setErrorMsg(result.error ?? 'Error al conectar con Google.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#111] border border-white/15 rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600" />

        <div className="p-8">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-black text-xl">
                {showForgot ? 'Recuperar contraseña' : isLogin ? 'Bienvenida de vuelta' : 'Únete a MonsterElegant'}
              </h2>
              <p className="text-white/40 text-xs">
                {showForgot ? 'Te enviaremos un enlace de recuperación' : isLogin ? 'Accede a tus diseños y pedidos' : 'Comienza a crear tu moda única'}
              </p>
            </div>
          </div>

          {!showForgot && (
            <div className="flex p-1 bg-white/5 rounded-xl mb-6">
              <button
                onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isLogin ? 'bg-white text-[#0a0a0a] shadow-lg' : 'text-white/50 hover:text-white'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  !isLogin ? 'bg-white text-[#0a0a0a] shadow-lg' : 'text-white/50 hover:text-white'
                }`}
              >
                Registrarse
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              {successMsg}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && !showForgot && (
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-rose-500/50 transition-all"
                />
              </div>
            )}

            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-rose-500/50 transition-all"
              />
            </div>

            {!showForgot && (
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-rose-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-all"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}

            {isLogin && !showForgot && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-rose-400 hover:text-rose-300 text-xs transition-all"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold hover:opacity-90 hover:shadow-xl hover:shadow-rose-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {showForgot ? 'Enviar enlace' : isLogin ? 'Iniciar Sesión' : 'Crear mi cuenta'}
            </button>

            {showForgot && (
              <button
                type="button"
                onClick={() => { setShowForgot(false); setErrorMsg(''); setSuccessMsg(''); }}
                className="w-full py-3 rounded-xl border border-white/15 text-white/60 hover:text-white text-sm font-medium transition-all"
              >
                Volver al inicio de sesión
              </button>
            )}
          </form>

          {!showForgot && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-xs">o continúa con</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <button
                onClick={handleGoogle}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-white/15 text-white/70 hover:bg-white/5 hover:text-white text-sm font-medium transition-all disabled:opacity-50"
              >
                <Chrome size={18} />
                Google
              </button>

              {!isLogin && (
                <p className="text-white/30 text-xs text-center mt-5 leading-relaxed">
                  Al registrarte, aceptas nuestros{' '}
                  <button className="text-rose-400 hover:text-rose-300 transition-all">Términos de Servicio</button>{' '}
                  y{' '}
                  <button className="text-rose-400 hover:text-rose-300 transition-all">Política de Privacidad</button>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
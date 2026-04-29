'use client';
import React, { useState, useTransition } from 'react';
import { Package, Truck, CheckCircle, Search, Clock, MapPin, Loader } from 'lucide-react';
import { trackOrderByNumber, type OrderStatus } from '../actions/orders';

interface OrderTrackingProps {
  fullPage?: boolean;
}

const STATUS_STEPS = [
  { key: 'confirmed', label: 'Pedido confirmado', icon: CheckCircle },
  { key: 'in_production', label: 'En producción', icon: Package },
  { key: 'shipped', label: 'Enviado', icon: Truck },
  { key: 'delivered', label: 'Entregado', icon: MapPin },
];

const STATUS_ORDER = ['confirmed', 'in_production', 'shipped', 'delivered'];

function getStatusIndex(status: string): number {
  return STATUS_ORDER.indexOf(status);
}

function getStatusBadge(status: string): { label: string; colorClass: string; iconClass: string } {
  const map: Record<string, { label: string; colorClass: string; iconClass: string }> = {
    confirmed: { label: 'Confirmado', colorClass: 'bg-blue-500/20 border-blue-500/30', iconClass: 'text-blue-400' },
    in_production: { label: 'En Producción', colorClass: 'bg-amber-500/20 border-amber-500/30', iconClass: 'text-amber-400' },
    shipped: { label: 'Enviado', colorClass: 'bg-purple-500/20 border-purple-500/30', iconClass: 'text-purple-400' },
    delivered: { label: 'Entregado', colorClass: 'bg-green-500/20 border-green-500/30', iconClass: 'text-green-400' },
    cancelled: { label: 'Cancelado', colorClass: 'bg-rose-500/20 border-rose-500/30', iconClass: 'text-rose-400' },
  };
  return map[status] ?? { label: status, colorClass: 'bg-white/10 border-white/20', iconClass: 'text-white/50' };
}

export default function OrderTracking({ fullPage }: OrderTrackingProps) {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSearch = () => {
    if (!orderId.trim()) return;
    setErrorMsg('');
    setOrder(null);

    startTransition(async () => {
      const result = await trackOrderByNumber(orderId.trim());
      setSearched(true);
      if (result.success && result.order) {
        setOrder(result.order);
      } else {
        setErrorMsg(result.error ?? 'No se encontró el pedido.');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const currentStatusIndex = order ? getStatusIndex(order.status) : -1;
  const badge = order ? getStatusBadge(order.status) : null;
  const firstItem = order?.items?.[0];
  const displayImage = firstItem?.image_snapshot ?? `https://loremflickr.com/80/80/dress?lock=31`;
  const displayName = firstItem?.product_name_snapshot ?? firstItem?.prompt_snapshot?.slice(0, 40) ?? 'Diseño personalizado';

  return (
    <section className={`${fullPage ? 'pt-24 min-h-screen' : ''} py-24 px-4 relative`}>
      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/10 to-transparent" />
      <div className="max-w-4xl mx-auto relative">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest text-purple-400 uppercase mb-3 block">Seguimiento</span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Sigue tu Pedido
          </h2>
          <p className="text-white/50 max-w-md mx-auto">
            Conoce el estado de tu prenda en tiempo real
          </p>
        </div>

        <div className="flex gap-3 mb-10">
          <input
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Introduce tu número de pedido (ej: ME-2024-0891)"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-rose-500/50 transition-all"
          />
          <button
            onClick={handleSearch}
            disabled={isPending || !orderId.trim()}
            className="flex items-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader size={18} className="animate-spin" /> : <Search size={18} />}
            <span className="hidden sm:inline">{isPending ? 'Buscando...' : 'Buscar'}</span>
          </button>
        </div>

        {errorMsg && searched && (
          <div className="mb-6 px-5 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {order && (
          <div className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
              <img
                src={displayImage}
                alt={displayName}
                className="w-16 h-16 rounded-2xl object-cover"
                onError={e => { (e.target as HTMLImageElement).src = 'https://loremflickr.com/80/80/dress?lock=31'; }}
              />
              <div className="flex-1">
                <p className="text-xs text-white/40 mb-1">Pedido #{order.order_number}</p>
                <h3 className="text-white font-bold text-lg">{displayName}</h3>
                <p className="text-white/50 text-sm flex items-center gap-1.5 mt-1">
                  <Clock size={13} />
                  {order.estimated_delivery
                    ? `Estimado: ${new Date(order.estimated_delivery).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : 'Fecha de entrega por confirmar'}
                </p>
              </div>
              {badge && (
                <div className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full ${badge.colorClass} border`}>
                  <Package size={14} className={badge.iconClass} />
                  <span className={`${badge.iconClass} text-xs font-bold`}>{badge.label}</span>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-white/10" />
              <div className="space-y-6">
                {STATUS_STEPS.map((step, i) => {
                  const isDone = i <= currentStatusIndex;
                  const isCurrent = i === currentStatusIndex + 1;
                  const IconComponent = step.icon;
                  return (
                    <div key={step.key} className="relative flex items-start gap-5">
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isDone
                          ? 'bg-gradient-to-br from-rose-500 to-purple-600 text-white shadow-lg shadow-rose-500/30'
                          : isCurrent
                          ? 'bg-white/10 border-2 border-white/30 text-white/50 animate-pulse'
                          : 'bg-white/5 border border-white/10 text-white/20'
                      }`}>
                        <IconComponent size={18} />
                      </div>
                      <div className="flex-1 pt-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold text-sm ${isDone ? 'text-white' : 'text-white/40'}`}>
                            {step.label}
                          </span>
                          <span className={`text-xs ${isDone ? 'text-white/50' : 'text-white/20'}`}>
                            {isDone ? new Date(order.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Pendiente'}
                          </span>
                        </div>
                        {isDone && step.key === 'in_production' && (
                          <p className="text-xs text-white/30 mt-1">Tu prenda está siendo confeccionada con cuidado</p>
                        )}
                        {isDone && step.key === 'shipped' && order.tracking_code && (
                          <p className="text-xs text-white/30 mt-1">Código de seguimiento: {order.tracking_code}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!fullPage && !order && !searched && (
          <div className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
              <div className="w-16 h-16 rounded-2xl bg-white/10 animate-pulse" />
              <div className="flex-1">
                <p className="text-xs text-white/20 mb-1">Introduce un número de pedido arriba</p>
                <h3 className="text-white/40 font-bold text-lg">Tu pedido aparecerá aquí</h3>
                <p className="text-white/20 text-sm mt-1">Ej: ME-2024-0001</p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-white/10" />
              <div className="space-y-6">
                {STATUS_STEPS.map((step, i) => {
                  const IconComponent = step.icon;
                  return (
                    <div key={step.key} className="relative flex items-start gap-5">
                      <div className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-white/5 border border-white/10 text-white/20">
                        <IconComponent size={18} />
                      </div>
                      <div className="flex-1 pt-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-white/20">{step.label}</span>
                          <span className="text-xs text-white/10">Pendiente</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
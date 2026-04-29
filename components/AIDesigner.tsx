'use client';
import React, { useState, useEffect, useTransition } from 'react';
import { Sparkles, Send, RefreshCw, Check, ChevronRight, Loader, Wand2 } from 'lucide-react';
import { fetchDesignOptions, saveDesign, addDesignToCart, type Fabric, type Color, type Size } from '../actions/designs';

interface AIDesignerProps {
  onAuthOpen: () => void;
  fullPage?: boolean;
}

const DESIGN_PRICE = 149.00;

export default function AIDesigner({ onAuthOpen, fullPage }: AIDesignerProps) {
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedFabricIdx, setSelectedFabricIdx] = useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState<number | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [savedDesignId, setSavedDesignId] = useState<string | null>(null);

  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  const [cartMsg, setCartMsg] = useState('');
  const [cartError, setCartError] = useState('');
  const [isPending, startTransition] = useTransition();

  const suggestions = [
    'Vestido midi con mangas abullonadas y escote en V profundo',
    'Blusa de seda con mangas mariposa y detalle de lazada',
    'Conjunto de falda plisada y top corsé con encaje',
  ];

  useEffect(() => {
    fetchDesignOptions().then(opts => {
      setFabrics(opts.fabrics);
      setColors(opts.colors);
      setSizes(opts.sizes);
      setOptionsLoaded(true);
    });
  }, []);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setCartMsg('');
    setCartError('');
    setSavedDesignId(null);
    const lockId = Math.floor(Math.random() * 50 + 1);
    const newImageUrl = `https://loremflickr.com/500/600/dress?lock=${lockId}`;
    setTimeout(() => {
      setGeneratedImageUrl(newImageUrl);
      setGenerating(false);
      setGenerated(true);
      setStep(2);
    }, 2500);
  };

  const handleReset = () => {
    setGenerated(false);
    setGenerating(false);
    setStep(1);
    setSavedDesignId(null);
    setCartMsg('');
    setCartError('');
  };

  const handleAddToCart = () => {
    if (!generated) return;
    const selectedSize = selectedSizeIdx !== null ? sizes[selectedSizeIdx] : null;
    if (!selectedSize) return;

    startTransition(async () => {
      setCartMsg('');
      setCartError('');

      const fabric = fabrics[selectedFabricIdx];
      const color = colors[selectedColorIdx];

      let designId = savedDesignId;

      if (!designId) {
        const saveResult = await saveDesign({
          promptText: prompt,
          promptLang: 'es',
          previewImageUrl: generatedImageUrl,
          fabricId: fabric?.id,
          colorId: color?.id,
          sizeId: selectedSize.id,
        });

        if (!saveResult.success) {
          if (saveResult.error?.includes('autenticado') || saveResult.error?.includes('No autenticado')) {
            onAuthOpen();
            return;
          }
          setCartError(saveResult.error ?? 'Error al guardar el diseño.');
          return;
        }
        designId = saveResult.designId!;
        setSavedDesignId(designId);
      }

      const cartResult = await addDesignToCart({
        designId,
        fabricId: fabric?.id ?? '',
        colorId: color?.id ?? '',
        sizeId: selectedSize.id,
        unitPrice: DESIGN_PRICE,
      });

      if (!cartResult.success) {
        if (cartResult.error?.includes('autenticado') || cartResult.error?.includes('No autenticado')) {
          onAuthOpen();
          return;
        }
        setCartError(cartResult.error ?? 'Error al añadir al carrito.');
      } else {
        setCartMsg('¡Diseño añadido al carrito!');
      }
    });
  };

  const currentColor = colors[selectedColorIdx];
  const currentFabric = fabrics[selectedFabricIdx];

  return (
    <section className={`${fullPage ? 'pt-24' : ''} py-24 px-4 relative overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-purple-600/5" />

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-widest text-purple-400 uppercase mb-3 block">Tecnología IA</span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Diseñador con{' '}
            <span className="bg-gradient-to-r from-rose-400 to-purple-500 bg-clip-text text-transparent">Inteligencia Artificial</span>
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Describe tu prenda ideal y observa cómo nuestra IA la visualiza en tiempo real
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                  step >= 1 ? 'bg-gradient-to-br from-rose-500 to-purple-600 text-white' : 'bg-white/10 text-white/40'
                }`}>1</div>
                <span className="text-white font-semibold">Describe tu prenda</span>
              </div>

              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Ej: Vestido midi floral con mangas globo, escote cuadrado y cintura ajustada con lazo..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm resize-none focus:outline-none focus:border-rose-500/50 transition-all"
              />

              <div className="mt-3 mb-4">
                <p className="text-white/30 text-xs mb-2">Sugerencias rápidas:</p>
                <div className="space-y-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(s)}
                      className="w-full text-left text-xs text-white/50 hover:text-white/80 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                    >
                      ✨ {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {generating ? (
                  <><Loader size={18} className="animate-spin" /> Generando diseño...</>
                ) : (
                  <><Wand2 size={18} /> Generar con IA <Send size={16} /></>
                )}
              </button>
            </div>

            {generated && optionsLoaded && (
              <>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 text-white text-sm font-bold">2</div>
                    <span className="text-white font-semibold">Elige tela y color</span>
                  </div>

                  <div className="mb-4">
                    <p className="text-white/40 text-xs mb-3 uppercase tracking-wider">Tela</p>
                    <div className="grid grid-cols-2 gap-2">
                      {fabrics.map((f, i) => (
                        <button
                          key={f.id}
                          onClick={() => setSelectedFabricIdx(i)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                            selectedFabricIdx === i
                              ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white'
                              : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          {f.name_es}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-white/40 text-xs mb-3 uppercase tracking-wider">Color</p>
                    <div className="flex gap-3 flex-wrap">
                      {colors.map((c, i) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedColorIdx(i)}
                          title={c.name_es}
                          className={`relative w-9 h-9 rounded-full border-2 transition-all hover:scale-110 ${
                            selectedColorIdx === i ? 'border-white scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c.hex_code }}
                        >
                          {selectedColorIdx === i && (
                            <Check size={14} className="absolute inset-0 m-auto text-rose-600" />
                          )}
                        </button>
                      ))}
                    </div>
                    {currentColor && <p className="text-white/40 text-xs mt-2">{currentColor.name_es}</p>}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 text-white text-sm font-bold">3</div>
                    <span className="text-white font-semibold">Elige tu talla</span>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {sizes.map((s, i) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSizeIdx(i)}
                        className={`w-14 h-12 rounded-xl font-bold text-sm transition-all ${
                          selectedSizeIdx === i
                            ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {cartError && (
                    <div className="mt-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
                      {cartError}
                    </div>
                  )}

                  {cartMsg && (
                    <div className="mt-4 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                      {cartMsg}
                    </div>
                  )}

                  {selectedSizeIdx !== null && (
                    <button
                      onClick={handleAddToCart}
                      disabled={isPending}
                      className="mt-6 w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold hover:shadow-xl hover:shadow-rose-500/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? (
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : null}
                      {isPending ? 'Procesando...' : 'Añadir al carrito'}
                      {!isPending && <ChevronRight size={18} />}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="sticky top-24">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 aspect-[4/5]">
              {!generated && !generating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <Sparkles size={32} className="text-white/20" />
                  </div>
                  <p className="text-white/30 text-sm">El preview de tu diseño aparecerá aquí</p>
                </div>
              )}

              {generating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
                    <Sparkles size={20} className="absolute inset-0 m-auto text-rose-400" />
                  </div>
                  <p className="text-white/50 text-sm animate-pulse">La IA está creando tu diseño...</p>
                </div>
              )}

              {generated && generatedImageUrl && (
                <>
                  <img
                    src={generatedImageUrl}
                    alt="AI Generated Design"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white text-xs font-medium flex items-center gap-1.5">
                      <Sparkles size={11} className="text-rose-400" />
                      Generado por IA
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
                      <p className="text-white text-sm font-medium mb-1">Tu diseño personalizado</p>
                      <p className="text-white/60 text-xs line-clamp-2">{prompt}</p>
                      <div className="flex items-center gap-2 mt-3">
                        {currentColor && (
                          <>
                            <div className="w-5 h-5 rounded-full border border-white/30" style={{ backgroundColor: currentColor.hex_code }} />
                            <span className="text-white/60 text-xs">{currentColor.name_es}</span>
                            <span className="text-white/30 text-xs">•</span>
                          </>
                        )}
                        {currentFabric && (
                          <span className="text-white/60 text-xs">{currentFabric.name_es}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-all"
                  >
                    <RefreshCw size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
'use client';
import React, { useState, useEffect, useTransition } from 'react';
import { Heart, ShoppingBag, Sparkles, Star, Loader } from 'lucide-react';
import { fetchFeaturedProducts, toggleWishlistProduct, addProductToCart, type Product } from '../actions/products';

const FALLBACK_IMAGES = [
  'https://loremflickr.com/400/500/dress?lock=21',
  'https://loremflickr.com/400/500/blouse?lock=22',
  'https://loremflickr.com/400/500/elegant?lock=23',
  'https://loremflickr.com/400/500/fashion?lock=24',
  'https://loremflickr.com/400/500/style?lock=25',
  'https://loremflickr.com/400/500/clothing?lock=26',
];

const BADGE_GRADIENT_MAP: Record<string, string> = {
  rose: 'from-rose-500 to-pink-500',
  purple: 'from-purple-500 to-indigo-500',
  amber: 'from-amber-500 to-rose-500',
  green: 'from-green-500 to-teal-500',
  blue: 'from-blue-500 to-indigo-500',
};

function getBadgeGradient(badgeColor: string | null): string {
  if (!badgeColor) return 'from-rose-500 to-pink-500';
  return BADGE_GRADIENT_MAP[badgeColor.toLowerCase()] ?? 'from-rose-500 to-pink-500';
}

interface FeaturedProductsProps {
  setActivePage: (page: string) => void;
}

export default function FeaturedProducts({ setActivePage }: FeaturedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedItems, setLikedItems] = useState<string[]>([]);
  const [cartMessages, setCartMessages] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedProducts().then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const toggleLike = (productId: string) => {
    startTransition(async () => {
      const optimisticLiked = likedItems.includes(productId)
        ? likedItems.filter(id => id !== productId)
        : [...likedItems, productId];
      setLikedItems(optimisticLiked);

      const result = await toggleWishlistProduct(productId);
      if (!result.success) {
        setLikedItems(likedItems);
      }
    });
  };

  const handleAddToCart = (product: Product) => {
    setPendingProductId(product.id);
    startTransition(async () => {
      const result = await addProductToCart(product.id, product.price);
      if (result.success) {
        setCartMessages(prev => ({ ...prev, [product.id]: '¡Añadido!' }));
        setTimeout(() => {
          setCartMessages(prev => { const next = { ...prev }; delete next[product.id]; return next; });
        }, 2000);
      } else {
        setCartMessages(prev => ({ ...prev, [product.id]: result.error ?? 'Error' }));
        setTimeout(() => {
          setCartMessages(prev => { const next = { ...prev }; delete next[product.id]; return next; });
        }, 2500);
      }
      setPendingProductId(null);
    });
  };

  if (loading) {
    return (
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div>
              <span className="text-xs font-bold tracking-widest text-rose-400 uppercase mb-3 block">Colección Destacada</span>
              <h2 className="text-4xl md:text-5xl font-black text-white">Diseños Populares</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-3xl bg-white/5 border border-white/10 aspect-[4/5] animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const displayProducts = products.length > 0 ? products : [];

  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
          <div>
            <span className="text-xs font-bold tracking-widest text-rose-400 uppercase mb-3 block">Colección Destacada</span>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              Diseños Populares
            </h2>
          </div>
          <button className="mt-4 md:mt-0 text-white/50 hover:text-white text-sm font-medium transition-all flex items-center gap-1 group">
            Ver toda la colección
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {displayProducts.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Sparkles size={40} className="mx-auto mb-4 opacity-30" />
            <p>Próximamente nuevos diseños destacados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayProducts.map((product, idx) => (
              <div key={product.id} className="group relative rounded-3xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-2">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={product.image_url ?? FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]}
                    alt={product.name_es}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {(product.badge_label_es) && (
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${getBadgeGradient(product.badge_color)} text-white text-xs font-bold shadow-lg`}>
                        {product.badge_label_es}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => toggleLike(product.id)}
                    className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      likedItems.includes(product.id)
                        ? 'bg-rose-500 text-white scale-110'
                        : 'bg-black/30 backdrop-blur-sm text-white/70 hover:bg-rose-500 hover:text-white'
                    }`}
                  >
                    <Heart size={15} fill={likedItems.includes(product.id) ? 'white' : 'none'} />
                  </button>

                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <button
                      onClick={() => setActivePage('designer')}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-[#0a0a0a] font-bold text-sm hover:bg-white/90 transition-all"
                    >
                      <Sparkles size={15} />
                      Personalizar este diseño
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}
                      />
                    ))}
                    <span className="text-white/40 text-xs ml-1">({product.review_count})</span>
                  </div>

                  <h3 className="text-white font-bold text-base mb-3">{product.name_es}</h3>

                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-white">${product.price.toFixed(2)}</span>
                      {product.original_price && (
                        <span className="text-sm text-white/30 line-through">${product.original_price.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="relative">
                      {cartMessages[product.id] ? (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                          cartMessages[product.id] === '¡Añadido!' ? 'text-green-400 bg-green-500/10' : 'text-rose-400 bg-rose-500/10'
                        }`}>
                          {cartMessages[product.id]}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={isPending && pendingProductId === product.id}
                          className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white hover:opacity-80 transition-all hover:scale-110 disabled:opacity-50"
                        >
                          {isPending && pendingProductId === product.id ? (
                            <Loader size={13} className="animate-spin" />
                          ) : (
                            <ShoppingBag size={15} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
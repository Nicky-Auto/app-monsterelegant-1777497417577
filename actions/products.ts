'use server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

function getServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set() {},
        remove() {},
      },
    }
  );
}

export interface Product {
  id: string;
  name_es: string;
  name_en: string;
  description_es: string | null;
  description_en: string | null;
  price: number;
  original_price: number | null;
  badge_label_es: string | null;
  badge_label_en: string | null;
  badge_color: string | null;
  image_url: string | null;
  rating: number;
  review_count: number;
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('products')
    .select('id, name_es, name_en, description_es, description_en, price, original_price, badge_label_es, badge_label_en, badge_color, image_url, rating, review_count')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('sort_order')
    .limit(6);

  if (error) {
    console.error('[fetchFeaturedProducts]', error.message);
    return [];
  }
  return data ?? [];
}

export interface WishlistResult {
  success: boolean;
  error?: string;
}

export async function toggleWishlistProduct(productId: string): Promise<WishlistResult> {
  const supabase = getServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'No autenticado. Inicia sesión para guardar favoritos.' };
  }

  const { data: existing } = await supabase
    .from('wishlist')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('wishlist').delete().eq('id', existing.id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } else {
    const { error } = await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }
}

export async function addProductToCart(productId: string, unitPrice: number): Promise<{ success: boolean; error?: string }> {
  const supabase = getServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'No autenticado. Inicia sesión para añadir al carrito.' };
  }

  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + 1 })
      .eq('id', existing.id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } else {
    const { error } = await supabase
      .from('cart_items')
      .insert({ user_id: user.id, product_id: productId, quantity: 1, unit_price: unitPrice });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }
}
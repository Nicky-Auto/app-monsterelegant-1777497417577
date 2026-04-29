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

export interface Fabric {
  id: string;
  name_es: string;
  name_en: string;
}

export interface Color {
  id: string;
  name_es: string;
  name_en: string;
  hex_code: string;
}

export interface Size {
  id: string;
  label: string;
  sort_order: number;
}

export interface FetchOptionsResult {
  fabrics: Fabric[];
  colors: Color[];
  sizes: Size[];
}

export async function fetchDesignOptions(): Promise<FetchOptionsResult> {
  const supabase = getServerSupabase();

  const [fabricsRes, colorsRes, sizesRes] = await Promise.all([
    supabase.from('fabrics').select('id, name_es, name_en').eq('is_active', true).order('sort_order'),
    supabase.from('colors').select('id, name_es, name_en, hex_code').eq('is_active', true).order('sort_order'),
    supabase.from('sizes').select('id, label, sort_order').eq('is_active', true).order('sort_order'),
  ]);

  return {
    fabrics: fabricsRes.data ?? [],
    colors: colorsRes.data ?? [],
    sizes: sizesRes.data ?? [],
  };
}

export interface SaveDesignParams {
  promptText: string;
  promptLang: 'es' | 'en';
  previewImageUrl?: string;
  fabricId?: string;
  colorId?: string;
  sizeId?: string;
  aiModelUsed?: string;
  aiGenerationId?: string;
}

export interface SaveDesignResult {
  success: boolean;
  designId?: string;
  error?: string;
}

export async function saveDesign(params: SaveDesignParams): Promise<SaveDesignResult> {
  const supabase = getServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'No autenticado. Inicia sesión para guardar tu diseño.' };
  }

  const { data, error } = await supabase
    .from('designs')
    .insert({
      user_id: user.id,
      prompt_text: params.promptText,
      prompt_lang: params.promptLang,
      preview_image_url: params.previewImageUrl,
      fabric_id: params.fabricId,
      color_id: params.colorId,
      size_id: params.sizeId,
      ai_model_used: params.aiModelUsed,
      ai_generation_id: params.aiGenerationId,
      is_saved: true,
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, designId: data.id };
}

export interface AddDesignToCartParams {
  designId: string;
  fabricId: string;
  colorId: string;
  sizeId: string;
  unitPrice: number;
  notes?: string;
}

export interface CartResult {
  success: boolean;
  cartItemId?: string;
  error?: string;
}

export async function addDesignToCart(params: AddDesignToCartParams): Promise<CartResult> {
  const supabase = getServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'No autenticado. Inicia sesión para añadir al carrito.' };
  }

  const { data, error } = await supabase
    .from('cart_items')
    .insert({
      user_id: user.id,
      design_id: params.designId,
      fabric_id: params.fabricId,
      color_id: params.colorId,
      size_id: params.sizeId,
      quantity: 1,
      unit_price: params.unitPrice,
      notes: params.notes,
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, cartItemId: data.id };
}
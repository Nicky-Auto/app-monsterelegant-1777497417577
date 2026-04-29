import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  profiles: {
    id: string;
    user_id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    preferred_lang: 'es' | 'en';
    created_at: string;
    updated_at: string;
  };
  fabrics: {
    id: string;
    name_es: string;
    name_en: string;
    description_es: string | null;
    description_en: string | null;
    is_active: boolean;
    sort_order: number;
  };
  colors: {
    id: string;
    name_es: string;
    name_en: string;
    hex_code: string;
    is_active: boolean;
    sort_order: number;
  };
  sizes: {
    id: string;
    label: string;
    sort_order: number;
    is_active: boolean;
  };
  products: {
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
    is_active: boolean;
    is_featured: boolean;
    sort_order: number;
  };
};
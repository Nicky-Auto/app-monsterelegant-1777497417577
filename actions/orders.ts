'use server';
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

export interface OrderStatus {
  id: string;
  order_number: string;
  status: 'confirmed' | 'in_production' | 'shipped' | 'delivered' | 'cancelled';
  estimated_delivery: string | null;
  tracking_code: string | null;
  created_at: string;
  updated_at: string;
  total_amount: number;
  currency: string;
  items: OrderItemDetail[];
}

export interface OrderItemDetail {
  id: string;
  quantity: number;
  unit_price: number;
  product_name_snapshot: string | null;
  prompt_snapshot: string | null;
  image_snapshot: string | null;
  fabric_snapshot: string | null;
  color_snapshot: string | null;
  size_snapshot: string | null;
}

export interface TrackOrderResult {
  success: boolean;
  order?: OrderStatus;
  error?: string;
}

export async function trackOrderByNumber(orderNumber: string): Promise<TrackOrderResult> {
  const supabase = getServerSupabase();

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      estimated_delivery,
      tracking_code,
      created_at,
      updated_at,
      total_amount,
      currency,
      order_items (
        id,
        quantity,
        unit_price,
        product_name_snapshot,
        prompt_snapshot,
        image_snapshot,
        fabric_snapshot,
        color_snapshot,
        size_snapshot
      )
    `)
    .eq('order_number', orderNumber.trim().toUpperCase())
    .single();

  if (error || !order) {
    return { success: false, error: 'No encontramos ningún pedido con ese número. Verifica e intenta de nuevo.' };
  }

  return {
    success: true,
    order: {
      ...order,
      items: (order.order_items as OrderItemDetail[]) ?? [],
    },
  };
}

export async function getCartItemCount(): Promise<number> {
  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from('cart_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return count ?? 0;
}
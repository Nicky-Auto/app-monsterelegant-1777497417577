'use server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: { id: string; email: string | undefined };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };
  return { success: true, user: { id: data.user.id, email: data.user.email } };
}

export async function signUpWithEmail(email: string, password: string, fullName: string): Promise<AuthResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { success: false, error: error.message };
  return { success: true, user: { id: data.user!.id, email: data.user!.email } };
}

export async function signInWithGoogle(): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  });
  if (error) return { success: false, error: error.message };
  return { success: true, url: data.url };
}

export async function resetPassword(email: string): Promise<AuthResult> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function signOut(): Promise<AuthResult> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) return { success: false, error: error.message };
  return { success: true };
}
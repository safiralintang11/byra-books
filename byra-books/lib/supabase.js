import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && key);

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    '[Byra Books] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi. ' +
      'Buat file .env.local di folder utama project lalu restart server.'
  );
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder-key');

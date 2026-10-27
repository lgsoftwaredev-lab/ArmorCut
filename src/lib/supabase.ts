import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuración de Supabase para ArmorCut (PlusCars Detailing)
const DEFAULT_SUPABASE_URL = 'https://wsaachsdpseidghbkrxa.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_v399EndRz76eaGT8Rfz0uA_p9hzzjsh';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim().length > 0 &&
    supabaseUrl.startsWith('https://') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim().length > 20
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

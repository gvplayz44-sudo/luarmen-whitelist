import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SB_URL || '';
const supabaseAnonKey = import.meta.env.SB_ANON || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

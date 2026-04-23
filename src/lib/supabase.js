import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        getSession: async () => ({ 
          data: { 
            session: { 
              user: { email: "demo@easyway.app" } 
            } 
          } 
        }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ error: { message: "Supabase not configured" } }),
        signUp: async () => ({ error: { message: "Supabase not configured" } }),
        signOut: async () => ({ error: null }),
      }
    };

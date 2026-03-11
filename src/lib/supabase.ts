import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. DB features will be disabled.');
}

// Export a dummy client if credentials are missing to prevent top-level crashes
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: () => ({
            select: () => ({
                order: () => Promise.resolve({ data: [], error: null }),
                eq: () => Promise.resolve({ data: [], error: null }),
                upsert: () => Promise.resolve({ error: null }),
                delete: () => Promise.resolve({ error: null }),
                update: () => Promise.resolve({ error: null }),
            }),
            insert: () => Promise.resolve({ error: null }),
            update: () => ({ eq: () => Promise.resolve({ error: null }) }),
            delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
            upsert: () => Promise.resolve({ error: null }),
        }),
        channel: () => ({
            on: () => ({
                subscribe: () => ({ unsubscribe: () => { } })
            }),
            subscribe: () => ({ unsubscribe: () => { } })
        }),
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: () => Promise.resolve({ data: {}, error: null }),
            signInWithOAuth: () => Promise.resolve({ data: {}, error: null }),
            signUp: () => Promise.resolve({ data: {}, error: null }),
            signOut: () => Promise.resolve({ error: null }),
        },
        removeChannel: () => { }
    } as any;

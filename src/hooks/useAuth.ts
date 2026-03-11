import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { type User, type Session } from '@supabase/supabase-js';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Init session
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) console.error('Error signing in with Google:', error.message);
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error signing out:', error.message);
    };

    const updateUsername = async (newName: string): Promise<{ error: string | null }> => {
        const { data, error } = await supabase.auth.updateUser({
            data: { display_name: newName }
        });
        if (error) return { error: error.message };
        if (data.user) setUser(data.user);
        return { error: null };
    };

    return {
        user,
        session,
        loading,
        signInWithGoogle,
        signOut,
        updateUsername
    };
}

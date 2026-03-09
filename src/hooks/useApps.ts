import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AppMeta {
    id: string;
    name: string;
    url: string;
    tagline: string;
    analysis: string[];
    revenue: string;
    merit: string;
    genre?: string;
    likesCount?: number;
    created_by?: string;
}

export const GENRES = [
    'ツール',
    'ミーム',
    'ゲーム'
] as const;

const STORAGE_KEY = 'pirasa_apps_v11';
const DEVICE_ID_KEY = 'pirasa_device_id';
const SAVED_APPS_KEY = 'pirasa_saved_apps';

export function useApps(userId?: string) {
    const [apps, setApps] = useState<AppMeta[]>([]);
    const [likesMap, setLikesMap] = useState<{ [id: string]: number }>({});
    const [loading, setLoading] = useState(true);
    const [deviceId, setDeviceId] = useState<string>('');
    const [savedAppIds, setSavedAppIds] = useState<string[]>([]);

    // Initialize Device ID and Saved Apps + Load cached apps
    useEffect(() => {
        let id = localStorage.getItem(DEVICE_ID_KEY);
        if (!id) {
            id = 'dev_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem(DEVICE_ID_KEY, id);
        }
        setDeviceId(id);

        const saved = localStorage.getItem(SAVED_APPS_KEY);
        if (saved) {
            try {
                setSavedAppIds(JSON.parse(saved));
            } catch (e) {
                setSavedAppIds([]);
            }
        }

        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
            try {
                setApps(JSON.parse(cached));
            } catch (e) {
                console.warn('Failed to parse cached apps');
            }
        }
    }, []);

    // Persist Saved Apps to Local
    useEffect(() => {
        localStorage.setItem(SAVED_APPS_KEY, JSON.stringify(savedAppIds));
    }, [savedAppIds]);

    // Fetch user-saved apps from Supabase if logged in
    useEffect(() => {
        if (!userId) return;

        const fetchUserSaved = async () => {
            try {
                const { data, error } = await supabase
                    .from('user_saved_apps')
                    .select('app_id')
                    .eq('user_id', userId);

                if (!error && data) {
                    const ids = data.map((r: any) => r.app_id);
                    // Merge with local if any (migration)
                    setSavedAppIds(prev => Array.from(new Set([...prev, ...ids])));
                }
            } catch (e) {
                console.warn('user_saved_apps table might not exist yet');
            }
        };

        fetchUserSaved();
    }, [userId]);

    // Fetch apps from Supabase
    const fetchApps = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('apps')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching apps:', error);
                return;
            }

            if (data && data.length > 0) {
                setApps(data);
            }
        } catch (e) {
            console.error('Critical error fetching apps:', e);
        }
    }, []);

    // Fetch likes from Supabase
    const fetchLikes = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('app_stats')
                .select('app_id, likes');

            if (error) {
                console.error('Error fetching likes:', error);
                return;
            }

            const map: { [id: string]: number } = {};
            data.forEach((row: any) => {
                map[row.app_id] = row.likes;
            });
            setLikesMap(map);
        } catch (e) {
            console.error('Critical error fetching likes:', e);
        }
    }, []);

    const init = useCallback(async () => {
        setLoading(true);

        const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
        const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!hasUrl || !hasKey) {
            console.warn('Supabase not configured. Using local/cached data.');
            setTimeout(() => setLoading(false), 500);
            return;
        }

        try {
            await Promise.all([fetchApps(), fetchLikes()]);
        } catch (e) {
            console.error('Initialization error:', e);
        } finally {
            setLoading(false);
        }
    }, [fetchApps, fetchLikes]);

    useEffect(() => {
        const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
        const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;

        init();

        if (hasUrl && hasKey) {
            const statsChannel = supabase
                .channel('app_stats_changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'app_stats' }, () => {
                    fetchLikes();
                })
                .subscribe();

            const appsChannel = supabase
                .channel('apps_changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'apps' }, () => {
                    fetchApps();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(statsChannel);
                supabase.removeChannel(appsChannel);
            };
        }
    }, [init, fetchLikes, fetchApps]);

    // Local sync
    useEffect(() => {
        if (apps.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
        }
    }, [apps]);

    const appsWithLikes = apps.map(app => ({
        ...app,
        likesCount: likesMap[app.id] || 0
    }));

    // Keep stable order: Home first, then insertion order.
    // DO NOT sort by likesCount here — it would cause activeIndex to point
    // to a different app after every vote, making counts appear not to change.
    const sortedApps = appsWithLikes.sort((a, b) => {
        if (a.url === 'internal:home') return -1;
        if (b.url === 'internal:home') return 1;
        return 0; // preserve insertion order for all other apps
    });

    const addApp = async (app: Omit<AppMeta, 'id'>) => {
        const id = Date.now().toString();
        const newApp = { ...app, id, created_by: userId || deviceId };

        // Optimistic update
        setApps(prev => [...prev, newApp as AppMeta]);

        const { error } = await supabase.from('apps').insert([newApp]);
        if (error) {
            console.error('Error adding app to Supabase:', error);
        }
    };

    const updateApp = async (id: string, app: Omit<AppMeta, 'id'>) => {
        // Optimistic update
        setApps(prev => prev.map(a => a.id === id ? { ...app, id } as AppMeta : a));

        const { error } = await supabase
            .from('apps')
            .update(app)
            .eq('id', id);

        if (error) {
            console.error('Error updating app in Supabase:', error);
        }
    };

    const removeApp = async (id: string) => {
        // Optimistic update
        setApps(prev => prev.filter(a => a.id !== id));

        const { error } = await supabase
            .from('apps')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error removing app from Supabase:', error);
        }
    };

    const reorder = (from: number, to: number) => {
        setApps(prev => {
            const next = [...prev];
            const [item] = next.splice(from, 1);
            next.splice(to, 0, item);
            return next;
        });
    };

    const incrementLike = async (id: string) => {
        setLikesMap(prev => ({
            ...prev,
            [id]: (prev[id] || 0) + 1
        }));

        const currentLikes = likesMap[id] || 0;
        const { error } = await supabase
            .from('app_stats')
            .upsert({ app_id: id, likes: currentLikes + 1 }, { onConflict: 'app_id' });

        if (error) {
            console.error('Error updating likes:', error);
        }
    };

    const decrementLike = async (id: string) => {
        setLikesMap(prev => ({
            ...prev,
            [id]: (prev[id] || 0) - 1
        }));

        const currentLikes = likesMap[id] || 0;
        const { error } = await supabase
            .from('app_stats')
            .upsert({ app_id: id, likes: currentLikes - 1 }, { onConflict: 'app_id' });

        if (error) {
            console.error('Error updating likes:', error);
        }
    };

    const toggleSave = async (id: string) => {
        const isCurrentlySaved = savedAppIds.includes(id);

        setSavedAppIds(prev =>
            isCurrentlySaved ? prev.filter(i => i !== id) : [...prev, id]
        );

        if (userId) {
            try {
                if (isCurrentlySaved) {
                    await supabase
                        .from('user_saved_apps')
                        .delete()
                        .eq('user_id', userId)
                        .eq('app_id', id);
                } else {
                    await supabase
                        .from('user_saved_apps')
                        .insert([{ user_id: userId, app_id: id }]);
                }
            } catch (e) {
                console.error('Error syncing saved app to Supabase:', e);
            }
        }
    };

    return {
        apps: sortedApps,
        loading,
        deviceId,
        savedAppIds,
        addApp,
        updateApp,
        removeApp,
        reorder,
        incrementLike,
        decrementLike,
        toggleSave
    };
}

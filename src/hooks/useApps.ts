import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AppMeta {
    id: string;
    name: string;
    url: string;
    tagline: string;
    analysis: string[];
    merit: string;
    genre?: string;
    likesCount?: number;
    views?: number;
    created_by?: string;
    poster_name?: string;
    created_at?: string;
}

export const GENRES = [
    'ツール',
    'ミーム',
    'ゲーム'
] as const;

const STORAGE_KEY = 'pirasa_apps_v12';
const DEVICE_ID_KEY = 'pirasa_device_id';
const SAVED_APPS_KEY = 'pirasa_saved_apps';
const SEEN_APPS_KEY = 'pirasa_seen_apps_v1';

export function useApps(userId?: string) {
    const [apps, setApps] = useState<AppMeta[]>([]);
    const [likesMap, setLikesMap] = useState<{ [id: string]: number }>({});
    const [userVotesMap, setUserVotesMap] = useState<{ [id: string]: number }>({});
    const [loading, setLoading] = useState(true);
    const [deviceId, setDeviceId] = useState<string>('');
    const [savedAppIds, setSavedAppIds] = useState<string[]>([]);
    const [seenAppIds, setSeenAppIds] = useState<string[]>([]);

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

        const seen = localStorage.getItem(SEEN_APPS_KEY);
        if (seen) {
            try {
                setSeenAppIds(JSON.parse(seen));
            } catch (e) {
                setSeenAppIds([]);
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

    // Fetch user-saved apps and votes from Supabase if logged in
    useEffect(() => {
        if (!userId) return;

        const fetchUserData = async () => {
            try {
                const { data: savedData, error: savedError } = await supabase
                    .from('user_saved_apps')
                    .select('app_id')
                    .eq('user_id', userId);

                if (!savedError && savedData) {
                    const ids = savedData.map((r: any) => r.app_id);
                    setSavedAppIds(prev => Array.from(new Set([...prev, ...ids])));
                }

                const { data: votesData, error: votesError } = await supabase
                    .from('user_votes')
                    .select('app_id, vote_value')
                    .eq('user_id', userId);

                if (!votesError && votesData) {
                    const vMap: { [id: string]: number } = {};
                    votesData.forEach((r: any) => vMap[r.app_id] = r.vote_value);
                    setUserVotesMap(vMap);
                }
            } catch (e) {
                console.warn('User tables might not exist yet');
            }
        };

        fetchUserData();
    }, [userId]);

    // Fetch apps from Supabase (catalog)
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

            const homeApp: AppMeta = {
                id: 'home',
                name: 'Home',
                url: 'internal:home',
                tagline: 'Pirasa へようこそ',
                analysis: [
                    '上にスワイプで次のサイトへ。',
                    '左で低評価（Downvote）、右で高評価（Upvote）。',
                    'タップで詳細を開き、再読込やサイト訪問が可能。',
                    'ダブルクリックで設定画面。'
                ],
                merit: '直感的なインターフェースで新しいWeb体験。',
                genre: 'ツール'
            };

            if (data) {
                // Ensure Home app is always present, even if DB is empty
                const hasHome = data.some((app: any) => app.url === 'internal:home');
                if (!hasHome) {
                    setApps([homeApp, ...data]);
                } else {
                    setApps(data);
                }
            } else {
                setApps([homeApp]);
            }
        } catch (e) {
            console.error('Critical error fetching apps:', e);
        }
    }, []);

    // Fetch likes from Supabase (Aggregate from user_votes)
    const fetchLikes = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('user_votes')
                .select('app_id, vote_value');

            if (error) {
                console.error('Error fetching likes:', error);
                return;
            }

            const map: { [id: string]: number } = {};
            data.forEach((row: any) => {
                map[row.app_id] = (map[row.app_id] || 0) + row.vote_value;
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
                .channel('user_votes_changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'user_votes' }, (payload: any) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const { app_id, vote_value } = payload.new as any;
                        const oldRow = payload.old as any;
                        const diff = oldRow ? (vote_value - (oldRow.vote_value || 0)) : vote_value;

                        setLikesMap(prev => ({
                            ...prev,
                            [app_id]: (prev[app_id] || 0) + diff
                        }));
                    } else if (payload.eventType === 'DELETE') {
                        const { app_id, vote_value } = payload.old as any;
                        setLikesMap(prev => ({
                            ...prev,
                            [app_id]: (prev[app_id] || 0) - (vote_value || 0)
                        }));
                    }
                })
                .subscribe();

            const appsChannel = supabase
                .channel('apps_changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'apps' }, (payload: any) => {
                    if (payload.eventType === 'UPDATE') {
                        const updatedApp = payload.new as AppMeta;
                        setApps(prev => prev.map(a => a.id === updatedApp.id ? { ...a, ...updatedApp } : a));
                    } else if (payload.eventType === 'INSERT') {
                        const newApp = payload.new as AppMeta;
                        setApps(prev => {
                            if (prev.some(a => a.id === newApp.id)) return prev;
                            return [newApp, ...prev];
                        });
                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = (payload.old as any).id;
                        setApps(prev => prev.filter(a => a.id !== deletedId));
                    }
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
        // Prevent clearing cache exactly on first render before we fetch,
        // but if we genuinely fetched and got 0 apps (or only Home), reflect it.
        // When updating, 'loading' state handles safety.
        if (!loading) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
        }
    }, [apps, loading]);

    const appsWithLikes = apps.map(app => ({
        ...app,
        likesCount: likesMap[app.id] || 0
    }));

    // Discovery Algorithm: "Pirasa Rank"
    // Score = Engagement / (TimeDecay + 2)^1.8 * RandomFactor
    const sortedApps = [...appsWithLikes].sort((a, b) => {
        // Home always first
        if (a.url === 'internal:home') return -1;
        if (b.url === 'internal:home') return 1;

        const getScore = (item: any) => {
            const likes = item.likesCount || 0;
            const views = item.views || 0;
            const engagement = (likes * 15) + (views * 1);

            // Time decay (Hours since creation)
            const created = item.created_at ? new Date(item.created_at).getTime() : Date.now();
            const hoursOld = (Date.now() - created) / (1000 * 60 * 60);

            // Random jitter (±10% to keep feed fresh)
            const jitter = 0.9 + Math.random() * 0.2;

            return (engagement / Math.pow(hoursOld + 2, 1.8)) * jitter;
        };

        return getScore(b) - getScore(a);
    }).filter(app => {
        // Always show Home
        if (app.url === 'internal:home') return true;
        // Always show Saved
        if (savedAppIds.includes(app.id)) return true;
        // Hide if seen
        return !seenAppIds.includes(app.id);
    });

    const addApp = async (app: Omit<AppMeta, 'id'>) => {
        // Normalize URL for comparison
        const normalize = (u: string) => u.replace(/\/+$/, '').toLowerCase();
        const newUrlNormalized = normalize(app.url);

        const isDuplicate = apps.some(a => normalize(a.url) === newUrlNormalized);
        if (isDuplicate) {
            return { success: false, error: 'このサイトは既に登録されています。' };
        }

        const id = crypto.randomUUID();
        const newApp = { ...app, id, created_by: userId || deviceId };

        // Optimistic update
        setApps(prev => [...prev, newApp as AppMeta]);

        const { error } = await supabase.from('apps').insert([newApp]);
        if (error) {
            console.error('Error adding app to Supabase:', error);
            return { success: false, error: '登録中にエラーが発生しました。' };
        }
        return { success: true };
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

    const incrementView = async (id: string) => {
        // Optimistic UI update
        setApps(prev => prev.map(a => a.id === id ? { ...a, views: (a.views || 0) + 1 } : a));

        // Supabase update using RPC function for atomic increment
        // Assuming the user has run the SQL from the implementation plan
        const { error } = await supabase.rpc('increment_views', { row_id: id });

        if (error) {
            console.warn('RPC increment_views failed, falling back to simple update:', error);
            // Fallback: get current count and update
            const targetApp = apps.find(a => a.id === id);
            if (targetApp) {
                await supabase
                    .from('apps')
                    .update({ views: (targetApp.views || 0) + 1 })
                    .eq('id', id);
            }
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

    const handleVoteChange = async (id: string, newVote: number) => {
        if (!userId) return; // Must be logged in to vote with tracking

        const currentVote = userVotesMap[id] || 0;
        if (currentVote === newVote) return; // No change

        // Optimistic UI updates
        const statDiff = newVote - currentVote;

        setLikesMap(prev => ({
            ...prev,
            [id]: (prev[id] || 0) + statDiff
        }));

        setUserVotesMap(prev => ({
            ...prev,
            [id]: newVote
        }));

        // DB Updates
        if (newVote === 0) {
            await supabase.from('user_votes').delete().eq('user_id', userId).eq('app_id', id);
        } else {
            await supabase.from('user_votes').upsert({ user_id: userId, app_id: id, vote_value: newVote }, { onConflict: 'user_id,app_id' });
        }

        // Removed redundant app_stats upsert; global likes are now derived from user_votes
    };

    const incrementLike = async (id: string) => {
        if (!userId) {
            // If anonymous voting is not supported by user_votes, we might need a different approach
            // but for now we follow the "Correct: user_votes" instruction.
            setLikesMap(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
            return;
        }
        // If already upvoted, clicking again acts as an UNDO (0)
        const newVote = userVotesMap[id] === 1 ? 0 : 1;
        await handleVoteChange(id, newVote);
    };

    const decrementLike = async (id: string) => {
        if (!userId) {
            setLikesMap(prev => ({ ...prev, [id]: (prev[id] || 0) - 1 }));
            return;
        }
        // If already downvoted, clicking again acts as an UNDO (0)
        const newVote = userVotesMap[id] === -1 ? 0 : -1;
        await handleVoteChange(id, newVote);
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

    const markAsSeen = (id: string) => {
        if (id === 'home') return;
        setSeenAppIds(prev => {
            if (prev.includes(id)) return prev;
            const next = [...prev, id];
            localStorage.setItem(SEEN_APPS_KEY, JSON.stringify(next));
            return next;
        });
    };

    const resetSeen = () => {
        setSeenAppIds([]);
        localStorage.removeItem(SEEN_APPS_KEY);
    };

    return {
        apps: sortedApps,
        loading,
        deviceId,
        savedAppIds,
        seenAppIds,
        addApp,
        updateApp,
        removeApp,
        incrementView,
        reorder,
        incrementLike,
        decrementLike,
        toggleSave,
        markAsSeen,
        resetSeen,
        userVotesMap
    };
}

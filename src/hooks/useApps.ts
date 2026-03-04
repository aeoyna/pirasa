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

const DEFAULT_APPS: AppMeta[] = [
    {
        id: 'home',
        name: 'Home',
        url: 'internal:home',
        tagline: 'Pirasa へようこそ',
        analysis: [
            '上にスワイプで次のサイトへ。',
            '左で低評価（Downvote）、右で高評価（Upvote）。',
            'タップで詳細を開き、再読込やサイト訪問が可能。',
            'ダブルクリックで設定画面。',
        ],
        revenue: '無料',
        merit: '直感的なインターフェースで新しいWeb体験。',
        genre: 'ツール'
    },
    {
        id: '5',
        name: 'Saturn',
        url: 'https://saturn.leach.co.jp',
        tagline: 'AIが動くExcel。手作業を、ゼロにする。',
        analysis: [
            'Gmail請求書→全銀フォーマット出力という痛点直撃の設計。',
            'freee連携 for 経理エコシステムにがっちり食い込む戦略。',
            '「AIが動くExcel」という一言で価値を圧縮する命名センス。',
        ],
        revenue: 'Starter / Pro / Enterprise',
        merit: '手作業ゼロというゴール設定の明確さが導入決断を加速する。',
        genre: 'ツール'
    },
    {
        id: '101',
        name: 'PillPopMan Staging',
        url: 'https://stg.pillpopman.com',
        tagline: '開発中の最新機能をチェック。',
        analysis: ['本番環境前の検証用ステージングサイト。', '最新のUI/UX変更がいち早く反映される。', 'デバッグや機能テストのための重要拠点。'],
        revenue: '開発用',
        merit: '開発の進捗をリアルタイムで確認できる便利さ。',
        genre: 'ツール'
    },
    {
        id: '102',
        name: 'Card Flipping Game',
        url: 'https://card-flipping.replit.app/stage-select.html',
        tagline: 'ブラウザで遊べる神経衰弱。',
        analysis: ['Replitでホストされた軽量なパズルゲーム。', 'ステージ選択から始まる直感的なゲームプレイ。', 'ブラウザひとつでどこでも暇つぶしが可能。'],
        revenue: '無料',
        merit: 'インストールの手間なく、一瞬で遊び始められる。',
        genre: 'ゲーム'
    },
    {
        id: '103',
        name: 'Jibun Blog',
        url: 'https://jibunblog.com/login?next=%2F',
        tagline: '自分だけの物語を綴る場所。',
        analysis: ['シンプルで使いやすい個人ブログプラットフォーム。', 'ログイン後のダッシュボードで快適な執筆。', 'SEOに強く、読者に届きやすい設計。'],
        revenue: 'フリーミアム',
        merit: '書くことに集中できるクリーンな執筆環境。',
        genre: 'ツール'
    },
    {
        id: '104',
        name: 'Supply Chain Intelligence',
        url: 'https://supply-chain-intelligence.lanes.info',
        tagline: '物流の未来を可視化する。',
        analysis: ['サプライチェーンの動向を分析するB2Bプラットフォーム。', '大量のデータからインサイトを引き出すダッシュボード。', '業務効率化のための専門的なツール群。'],
        revenue: 'B2B契約',
        merit: '複雑な流通経路をデジタルで掌握する力。',
        genre: 'ツール'
    },
    {
        id: '105',
        name: 'Cat Tools',
        url: 'https://cat-tools.catnote.tokyo',
        tagline: '「猫の手」も借りたい人のためのツール集。',
        analysis: ['日常の小さな困りごとを解決する便利ツール詰め合わせ。', 'シンプルで広告のない使いやすいインターフェース。', 'ブラウザで完結するタスク処理の最適解。'],
        revenue: '無料',
        merit: '「これがあったらいいな」がすぐに見つかる。',
        genre: 'ツール'
    },
    {
        id: '106',
        name: 'Stream-Feed',
        url: 'https://stream-feed.app/ja',
        tagline: 'ストリームを加速する。',
        analysis: ['コンテンツ配信とフィード管理の統合プラットフォーム。', '多機能ながら洗練された日本語UI。', '最新情報の収集と発信をワンストップで。'],
        revenue: 'SaaS',
        merit: '情報の波に飲まれず、賢く泳ぐための武器。',
        genre: 'ツール'
    },
    {
        id: '107',
        name: 'CODI TeamDev',
        url: 'https://codi-teamdev.com',
        tagline: 'チーム開発をコード化する。',
        analysis: ['エンジニアチームのための開発支援ポータル。', 'ベストプラクティスの共有と自動化の推進。', 'モダンな技術スタックを駆使したプラットフォーム。'],
        revenue: '非公開',
        merit: '個人の力をチームの成果へ変換するハブ。',
        genre: 'ツール'
    },
    {
        id: '108',
        name: 'Gourmatch',
        url: 'https://gourmatch.jp',
        tagline: '美味しい出会いを、もっと身近に。',
        analysis: ['食をきっかけに繋がるマッチングサービス。', 'グルメな人々が集まるコミュニティ志向。', 'お店探しと出会いを同時に楽しめる体験。'],
        revenue: '広告 / 課金',
        merit: '「何を食べよう」から始まる新しい関係性。',
        genre: 'ミーム'
    },
    {
        id: '109',
        name: 'Colorless Guild',
        url: 'https://colorless-guild.utakata-scifi.com',
        tagline: '無彩色の冒険が始まる。',
        analysis: ['Utakata-Scifiが贈る独創的な世界観のWebコンテンツ。', 'SFライクなUI/UXと没入感のある物語。', 'Web技術を駆出したデジタルアート的な側面。'],
        revenue: 'コンテンツ販売',
        merit: '日常を忘れさせる非凡なデジタル・アドベンチャー。',
        genre: 'ゲーム'
    },
    {
        id: '110',
        name: 'WeBrew',
        url: 'https://lollonote.vercel.app/webrew.html',
        tagline: 'アイデアを醸造するノート。',
        analysis: ['Lollonote内で展開されるクリエイティブな実験ページ。', 'WebとBrew（醸造）を掛け合わせたユニークな発想。', 'シンプルながらインスピレーションを刺激する設計。'],
        revenue: 'オープンソース',
        merit: '思考を形にするためのミニマルなクリエイティブ空間。',
        genre: 'ツール'
    },
    {
        id: '6',
        name: 'Excalidraw',
        url: 'https://excalidraw.com',
        tagline: '手書き風のコラボ図形ツール。',
        analysis: [
            '手書きUI前向きな感情。',
            'インストール不要でリアルタイムコラボ。',
            'オープンソースで拡張性∞。',
        ],
        revenue: 'フリーミアム (Team: $7/mo)',
        merit: 'ブラウザだけで完結するホワイトボード体験。',
        genre: 'ツール'
    },
    {
        id: '1',
        name: 'MIURANUAN',
        url: 'https://miuranuan.vercel.app',
        tagline: '三浦半島の魅力を発信する。',
        analysis: [
            '地域特化という明確な立ち位置が強み。',
            'Vercelによる高速デプロイで開発速度を担保。',
            '個人開発らしいリアルな熱量が伝わるプロダクト。',
        ],
        revenue: '非公開',
        merit: '地域コミュニティへのリーチという唯一無二の価値。',
        genre: 'ツール'
    },
];

const STORAGE_KEY = 'pirasa_apps_v11';
const DEVICE_ID_KEY = 'pirasa_device_id';
const SAVED_APPS_KEY = 'pirasa_saved_apps';

export function useApps() {
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

    // Persist Saved Apps
    useEffect(() => {
        localStorage.setItem(SAVED_APPS_KEY, JSON.stringify(savedAppIds));
    }, [savedAppIds]);

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
            console.warn('Supabase not configured. Using local/default data.');
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

    // Merge logic: Ensure all DEFAULT_APPS are present if not in Supabase/local
    const effectiveApps = [...appsWithLikes];
    DEFAULT_APPS.forEach(def => {
        if (!effectiveApps.some(a => a.id === def.id)) {
            effectiveApps.push({ ...def, likesCount: 0 } as AppMeta & { likesCount: number });
        }
    });

    const sortedApps = effectiveApps.sort((a, b) => {
        if (a.id === 'home') return -1;
        if (b.id === 'home') return 1;
        return (b.likesCount || 0) - (a.likesCount || 0);
    });

    const addApp = async (app: Omit<AppMeta, 'id'>) => {
        const id = Date.now().toString();
        const newApp = { ...app, id, created_by: deviceId };

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

    const toggleSave = (id: string) => {
        setSavedAppIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
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
        toggleSave
    };
}

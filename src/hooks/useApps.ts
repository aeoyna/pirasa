import { useState, useEffect } from 'react';

export interface AppMeta {
    id: string;
    name: string;
    url: string;
    tagline: string;
    analysis: string[];
    revenue: string;
    merit: string;
}

const DEFAULT_APPS: AppMeta[] = [
    {
        id: '5',
        name: 'Saturn',
        url: 'https://saturn.leach.co.jp',
        tagline: 'AIが動くExcel。手作業を、ゼロにする。',
        analysis: [
            'Gmail請求書→全銀フォーマット出力という痛点直撃の設計。',
            'freee連携で経理エコシステムにがっちり食い込む戦略。',
            '「AIが動くExcel」という一言で価値を圧縮する命名センス。',
        ],
        revenue: 'Starter / Pro / Enterprise',
        merit: '手作業ゼロというゴール設定の明確さが導入決断を加速する。',
    },
    {
        id: '6',
        name: 'Excalidraw',
        url: 'https://excalidraw.com',
        tagline: '手書き風のコラボ図形ツール。',
        analysis: [
            '手書きUIの親しみやすさが圧倒的。',
            'インストール不要でリアルタイムコラボ。',
            'オープンソースで拡張性∞。',
        ],
        revenue: 'フリーミアム (Team: $7/mo)',
        merit: 'ブラウザだけで完結するホワイトボード体験。',
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
    },
];

// Bump version when default app list changes to force localStorage refresh
const STORAGE_KEY = 'pirasa_apps_v4';

export function useApps() {
    const [apps, setApps] = useState<AppMeta[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return JSON.parse(saved) as AppMeta[];
        } catch {/* ignore */ }
        return DEFAULT_APPS;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    }, [apps]);

    const addApp = (app: Omit<AppMeta, 'id'>) => {
        const newApp: AppMeta = { ...app, id: Date.now().toString() };
        setApps(prev => [...prev, newApp]);
    };

    const updateApp = (id: string, app: Omit<AppMeta, 'id'>) => {
        setApps(prev => prev.map(a => a.id === id ? { ...app, id } : a));
    };

    const removeApp = (id: string) => {
        setApps(prev => prev.filter(a => a.id !== id));
    };

    const reorder = (from: number, to: number) => {
        setApps(prev => {
            const next = [...prev];
            const [item] = next.splice(from, 1);
            next.splice(to, 0, item);
            return next;
        });
    };

    return { apps, addApp, updateApp, removeApp, reorder };
}

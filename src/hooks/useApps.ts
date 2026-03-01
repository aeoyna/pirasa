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
    },
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
        id: '101',
        name: 'PillPopMan Staging',
        url: 'https://stg.pillpopman.com',
        tagline: '開発中の最新機能をチェック。',
        analysis: ['本番環境前の検証用ステージングサイト。', '最新のUI/UX変更がいち早く反映される。', 'デバッグや機能テストのための重要拠点。'],
        revenue: '開発用',
        merit: '開発の進捗をリアルタイムで確認できる便利さ。'
    },
    {
        id: '102',
        name: 'Card Flipping Game',
        url: 'https://card-flipping.replit.app/stage-select.html',
        tagline: 'ブラウザで遊べる神経衰弱。',
        analysis: ['Replitでホストされた軽量なパズルゲーム。', 'ステージ選択から始まる直感的なゲームプレイ。', 'ブラウザひとつでどこでも暇つぶしが可能。'],
        revenue: '無料',
        merit: 'インストールの手間なく、一瞬で遊び始められる。'
    },
    {
        id: '103',
        name: 'Jibun Blog',
        url: 'https://jibunblog.com/login?next=%2F',
        tagline: '自分だけの物語を綴る場所。',
        analysis: ['シンプルで使いやすい個人ブログプラットフォーム。', 'ログイン後のダッシュボードで快適な執筆。', 'SEOに強く、読者に届きやすい設計。'],
        revenue: 'フリーミアム',
        merit: '書くことに集中できるクリーンな執筆環境。'
    },
    {
        id: '104',
        name: 'Supply Chain Intelligence',
        url: 'https://supply-chain-intelligence.lanes.info',
        tagline: '物流の未来を可視化する。',
        analysis: ['サプライチェーンの動向を分析するB2Bプラットフォーム。', '大量のデータからインサイトを引き出すダッシュボード。', '業務効率化のための専門的なツール群。'],
        revenue: 'B2B契約',
        merit: '複雑な流通経路をデジタルで掌握する力。'
    },
    {
        id: '105',
        name: 'Cat Tools',
        url: 'https://cat-tools.catnote.tokyo',
        tagline: '「猫の手」も借りたい人のためのツール集。',
        analysis: ['日常の小さな困りごとを解決する便利ツール詰め合わせ。', 'シンプルで広告のない使いやすいインターフェース。', 'ブラウザで完結するタスク処理の最適解。'],
        revenue: '無料',
        merit: '「これがあったらいいな」がすぐに見つかる。'
    },
    {
        id: '106',
        name: 'Stream-Feed',
        url: 'https://stream-feed.app/ja',
        tagline: 'ストリームを加速する。',
        analysis: ['コンテンツ配信とフィード管理の統合プラットフォーム。', '多機能ながら洗練された日本語UI。', '最新情報の収集と発信をワンストップで。'],
        revenue: 'SaaS',
        merit: '情報の波に飲まれず、賢く泳ぐための武器。'
    },
    {
        id: '107',
        name: 'CODI TeamDev',
        url: 'https://codi-teamdev.com',
        tagline: 'チーム開発をコード化する。',
        analysis: ['エンジニアチームのための開発支援ポータル。', 'ベストプラクティスの共有と自動化の推進。', 'モダンな技術スタックを駆使したプラットフォーム。'],
        revenue: '非公開',
        merit: '個人の力をチームの成果へ変換するハブ。'
    },
    {
        id: '108',
        name: 'Gourmatch',
        url: 'https://gourmatch.jp',
        tagline: '美味しい出会いを、もっと身近に。',
        analysis: ['食をきっかけに繋がるマッチングサービス。', 'グルメな人々が集まるコミュニティ志向。', 'お店探しと出会いを同時に楽しめる体験。'],
        revenue: '広告 / 課金',
        merit: '「何を食べよう」から始まる新しい関係性。'
    },
    {
        id: '109',
        name: 'Colorless Guild',
        url: 'https://colorless-guild.utakata-scifi.com',
        tagline: '無彩色の冒険が始まる。',
        analysis: ['Utakata-Scifiが贈る独創的な世界観のWebコンテンツ。', 'SFライクなUI/UXと没入感のある物語。', 'Web技術を駆使したデジタルアート的な側面。'],
        revenue: 'コンテンツ販売',
        merit: '日常を忘れさせる非凡なデジタル・アドベンチャー。'
    },
    {
        id: '110',
        name: 'WeBrew',
        url: 'https://lollonote.vercel.app/webrew.html',
        tagline: 'アイデアを醸造するノート。',
        analysis: ['Lollonote内で展開されるクリエイティブな実験ページ。', 'WebとBrew（醸造）を掛け合わせたユニークな発想。', 'シンプルながらインスピレーションを刺激する設計。'],
        revenue: 'オープンソース',
        merit: '思考を形にするためのミニマルなクリエイティブ空間。'
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
const STORAGE_KEY = 'pirasa_apps_v9';

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

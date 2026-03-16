import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { AppMeta } from '../hooks/useApps';
import { MyPage } from './MyPage';
import { BBSPanel } from './BBSPanel';
import { CommentsPanel } from './CommentsPanel';
import './TheFlow.css';

const MysteryBlock: React.FC = () => (
    <div className="brand-block">
        <img src="/icon.png" alt="Pirasa" className="brand-logo-icon" />
    </div>
);

const HomeView = () => (
    <div className="home-view">
        <div className="home-content">
            <div className="brand-hero">
                <img src="/icon.png" alt="Pirasa Logo" className="hero-logo" />
                <div className="hero-text">
                    <h1 className="hero-title">Pirasa</h1>
                    <p className="hero-subtitle">Sophisticated Curation Hub</p>
                </div>
            </div>

            <div className="tutorial-grid">
                <div className="tutorial-item vertical">
                    <div className="gesture-icon">✦</div>
                    <div className="gesture-text">
                        <strong>NAVIGATE</strong>
                        <span>「帯」を上下にスライド</span>
                    </div>
                </div>
                <div className="tutorial-item action">
                    <div className="gesture-icon">✥</div>
                    <div className="gesture-text">
                        <strong>ACTION HUB</strong>
                        <span>最下部からアクション</span>
                    </div>
                </div>
            </div>

            <div className="home-footer">
                <p><strong>最下部のタブ帯（帯）</strong>をスワイプして操作</p>
            </div>
        </div>
    </div>
);

interface Props {
    apps: AppMeta[];
    deviceId: string;
    savedAppIds: string[];
    userId?: string;
    userName?: string;
    onOpenAdmin: () => void;
    onIncrementLike: (id: string) => void;
    onDecrementLike: (id: string) => void;
    onToggleSave: (id: string) => void;
    onAddSite: (app: Omit<AppMeta, 'id'>) => Promise<{ success: boolean; error?: string } | void>;
    onUpdateSite: (id: string, app: Omit<AppMeta, 'id'>) => Promise<void>;
    onRemoveSite: (id: string) => Promise<void>;
    onIncrementView: (id: string) => void;
    onMarkAsSeen: (id: string) => void;
    onResetSeen: () => void;
    userVotesMap: { [id: string]: number };
}

export const TheFlow: React.FC<Props> = ({
    apps,
    deviceId,
    savedAppIds,
    userId,
    userName,
    onOpenAdmin,
    onIncrementLike,
    onDecrementLike,
    onToggleSave,
    onAddSite,
    onUpdateSite,
    onRemoveSite,
    onIncrementView,
    onMarkAsSeen,
    onResetSeen,
    userVotesMap
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isSmallDetailOpen, setIsSmallDetailOpen] = useState(false);
    const [isListOpen, setIsListOpen] = useState(false);
    const [isBoardOpen, setIsBoardOpen] = useState(false);
    const [isMyPageOpen, setIsMyPageOpen] = useState(false);
    const [myPageTab, setMyPageTab] = useState<'saved' | 'posts' | 'new'>('saved');
    const [toast, setToast] = useState<string | null>(null);
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
    const navRef = useRef<HTMLElement | null>(null);

    const iframeRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({});
    const isAnimatingRef = useRef(false);
    const appsRef = useRef(apps);
    appsRef.current = apps;
    const resolvedActiveIndex = Math.min(activeIndex, Math.max(0, apps.length - 1));
    const activeIndexRef = useRef(resolvedActiveIndex);
    activeIndexRef.current = resolvedActiveIndex;
    const containerRef = useRef<HTMLDivElement>(null);
    const total = apps.length;
    const totalRef = useRef(total);
    totalRef.current = total;
    const touchStart = useRef<{ y: number, time: number } | null>(null);
    const SWIPE_THRESHOLD = 60;

    useEffect(() => {
        if (activeIndex >= total && total > 0) setActiveIndex(total - 1);
    }, [total, activeIndex]);

    const goTo = useCallback((nextIndex: number) => {
        if (nextIndex < 0 || nextIndex >= totalRef.current || isAnimatingRef.current) return;
        isAnimatingRef.current = true;
        setIsAnimating(true);
        setActiveIndex(nextIndex);
        setIsSmallDetailOpen(true);
        setTimeout(() => {
            isAnimatingRef.current = false;
            setIsAnimating(false);
        }, 500);
    }, []);

    // Reset scroll position of the current slide whenever activeIndex changes
    useEffect(() => {
        const slides = containerRef.current?.querySelectorAll('.slide');
        if (slides && slides[resolvedActiveIndex]) {
            (slides[resolvedActiveIndex] as HTMLElement).scrollTop = 0;
        }

        // Increment view count and mark as seen when active index changes
        const currentApp = apps[resolvedActiveIndex];
        if (currentApp && currentApp.url !== 'internal:home') {
            onIncrementView(currentApp.id);
            // Mark as seen after a delay or on change
            onMarkAsSeen(currentApp.id);
        }
    }, [resolvedActiveIndex, apps, onIncrementView, onMarkAsSeen]);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2000);
    };

    const handleVote = (type: 'up' | 'down') => {
        const currentApp = apps[resolvedActiveIndex];
        if (!currentApp) return;
        if (type === 'up') {
            onIncrementLike(currentApp.id);
            showToast('Liked! ♥');
        } else if (type === 'down') {
            onDecrementLike(currentApp.id);
        }
    };

    const handleGestureStart = (y: number) => {
        touchStart.current = { y, time: Date.now() };
    };

    const handleGestureMove = (y: number) => {
        if (!touchStart.current || !navRef.current) return;
        const deltaY = y - touchStart.current.y;
        navRef.current.style.transform = `translateX(-50%) translateY(${deltaY * 0.15}px)`;
        navRef.current.style.transition = 'none';
    };

    const handleGestureEnd = (y: number) => {
        if (!touchStart.current) return;
        const deltaY = y - touchStart.current.y;
        const deltaTime = Date.now() - touchStart.current.time;
        touchStart.current = null;

        if (navRef.current) {
            navRef.current.style.transform = 'translateX(-50%) translateY(0)';
            navRef.current.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        }

        if (Math.abs(deltaY) > SWIPE_THRESHOLD && deltaTime < 500) {
            if (deltaY < 0) {
                goTo(activeIndexRef.current + 1);
            } else {
                goTo(activeIndexRef.current - 1);
            }
        }
    };

    useEffect(() => {
        const nav = containerRef.current?.querySelector('.bottom-nav-bar');
        const gestureTargets = [nav].filter(Boolean) as Element[];
        if (gestureTargets.length === 0) return;

        const onStart = (e: TouchEvent | MouseEvent) => {
            const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
            handleGestureStart(y);
        };

        const onMove = (e: any) => {
            const y = e.touches ? e.touches[0].clientY : (e.changedTouches ? e.changedTouches[0].clientY : e.clientY);
            handleGestureMove(y);
        };

        const onEnd = (e: TouchEvent | MouseEvent) => {
            const y = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
            handleGestureEnd(y);
        };

        let wheelTimeout: ReturnType<typeof setTimeout> | null = null;
        const onWheel = (e: WheelEvent) => {
            if (isAnimatingRef.current || wheelTimeout) return;

            // Normalize deltaY for trackpad sensitivity
            const sensitivity = 30;
            if (Math.abs(e.deltaY) > sensitivity) {
                e.preventDefault();
                if (e.deltaY > 0) {
                    goTo(activeIndexRef.current + 1);
                } else {
                    goTo(activeIndexRef.current - 1);
                }

                wheelTimeout = setTimeout(() => {
                    wheelTimeout = null;
                }, 800);
            }
        };

        gestureTargets.forEach(target => {
            target.addEventListener('touchstart', onStart as any);
            target.addEventListener('mousedown', onStart as any);
            target.addEventListener('touchmove', onMove as any);
            target.addEventListener('mousemove', onMove as any);
            target.addEventListener('wheel', onWheel as any, { passive: false });
        });
        window.addEventListener('touchend', onEnd as any);
        window.addEventListener('mouseup', onEnd as any);

        return () => {
            gestureTargets.forEach(target => {
                target.removeEventListener('touchstart', onStart as any);
                target.removeEventListener('mousedown', onStart as any);
                target.removeEventListener('touchmove', onMove as any);
                target.removeEventListener('mousemove', onMove as any);
                target.removeEventListener('wheel', onWheel as any);
            });
            window.removeEventListener('touchend', onEnd as any);
            window.removeEventListener('mouseup', onEnd as any);
            if (wheelTimeout) clearTimeout(wheelTimeout);
        };
    }, []);

    if (total === 0) {
        return (
            <div className="flow-empty">
                <p>サイトが登録されていません</p>
                <button onClick={onOpenAdmin}>＋ サイトを追加する</button>
            </div>
        );
    }

    const currentApp = apps[resolvedActiveIndex];

    if (!currentApp) {
        return (
            <div className="flow-empty">
                <p>サイトを読み込んでいます...</p>
                <div className="loader">✦</div>
            </div>
        );
    }

    return (
        <div className="flow-root" ref={containerRef}>
            {/* Main Content: Slide Stack */}
            <div className="view-container" onClick={() => setIsSmallDetailOpen(false)}>
                <div className="slide-stack"
                    style={{
                        transform: `translateY(-${resolvedActiveIndex * 100}dvh)`,
                        transition: isAnimating ? 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
                    }}
                >
                    {apps.map((app, index) => (
                        <div key={app.id} className="slide">
                            {app.url === 'internal:home' ? (
                                <HomeView />
                            ) : Math.abs(index - resolvedActiveIndex) <= 1 ? (
                                <div className="slide-content">
                                    <iframe
                                        ref={el => { iframeRefs.current[app.id] = el; }}
                                        src={app.url}
                                        title={app.name}
                                        className="app-iframe"
                                        loading={index === resolvedActiveIndex ? 'eager' : 'lazy'}
                                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                    />
                                    <div className="slide-bottom-buffer">
                                        <div className="buffer-branding">
                                            <img src="/icon.png" alt="" className="buffer-logo" />
                                            <span>End of Page</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="slide-placeholder" />
                            )}

                            {/* Small Detail Card (Scoped to Slide to animate with it) */}
                            {isSmallDetailOpen && app.url !== 'internal:home' && (
                                <>
                                    <div className="sd-overlay" onClick={(e) => { e.stopPropagation(); setIsSmallDetailOpen(false); }} />
                                    <div
                                        className="small-detail-card"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsDetailOpen(true);
                                            setIsSmallDetailOpen(false);
                                        }}
                                    >
                                        <div className="sd-content">
                                            <div className="sd-left">
                                                <div className="sd-icon-col">
                                                    <div className="sd-icon">
                                                        {imageErrors.has(app.id) ? (
                                                            <MysteryBlock />
                                                        ) : (
                                                            <img
                                                                src={`https://www.google.com/s2/favicons?sz=128&domain=${new URL(app.url).hostname}`}
                                                                alt=""
                                                                onError={() => setImageErrors(prev => new Set(prev).add(app.id))}
                                                            />
                                                        )}
                                                    </div>
                                                    <span className="sd-chip genre-chip">{app.genre || 'Other'}</span>
                                                </div>
                                                <div className="sd-info">
                                                    <div className="sd-title-row">
                                                        <div className="sd-title">{app.name}</div>
                                                    </div>
                                                    {app.merit && (
                                                        <div className="sd-chips merit-chips">
                                                            <span className="sd-chip merit-text">{app.merit}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="sd-right">
                                                <div className="sd-stats">
                                                    <span
                                                        className={`sd-save-btn ${savedAppIds.includes(app.id) ? 'active' : ''}`}
                                                        onClick={(e) => { e.stopPropagation(); onToggleSave(app.id); }}
                                                    >
                                                        ★
                                                    </span>
                                                    <button className="sd-visit-btn-small" onClick={(e) => { e.stopPropagation(); window.open(app.url, '_blank'); }}>
                                                        🚀
                                                    </button>
                                                </div>
                                                <div className="sd-vote-group">
                                                    <button className={`sd-vote-btn ${userVotesMap[app.id] === 1 ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleVote('up'); }}>+</button>
                                                    <span className="sd-vote-count">{app.likesCount || 0}</span>
                                                    <button className={`sd-vote-btn ${userVotesMap[app.id] === -1 ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleVote('down'); }}>-</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>


            <nav
                className="bottom-nav-bar"
                ref={navRef}
            >
                <button className="nav-item" onClick={() => setIsListOpen(true)}>
                    <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                        <path d="M5 3L4 4"></path>
                        <path d="M19 3l1 1"></path>
                        <path d="m5 21 1-1"></path>
                        <path d="M19 21l1-1"></path>
                    </svg>
                    <span className="nav-label">さがす</span>
                </button>
                <button className="nav-item" onClick={() => setIsBoardOpen(true)}>
                    <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    <span className="nav-label">掲示板</span>
                </button>
                <button className="nav-item" onClick={() => { setIsMyPageOpen(true); setMyPageTab('saved'); }}>
                    <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span className="nav-label">マイページ</span>
                </button>
            </nav>


            {/* Floating Info Trigger (appears when modal is closed) */}
            {!isSmallDetailOpen && !isDetailOpen && currentApp.url !== 'internal:home' && (
                <button
                    className="floating-info-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsSmallDetailOpen(true);
                    }}
                >
                    {imageErrors.has(currentApp.id) ? (
                        <div className="fi-icon-placeholder">✦</div>
                    ) : (
                        <img
                            src={`https://www.google.com/s2/favicons?sz=64&domain=${new URL(currentApp.url).hostname}`}
                            alt=""
                            onError={() => setImageErrors(prev => new Set(prev).add(currentApp.id))}
                        />
                    )}
                </button>
            )}

            {toast && <div className="pirasa-toast">{toast}</div>}

            {/* Detail overlay */}
            {isDetailOpen && (
                <div className="detail-overlay" onClick={() => setIsDetailOpen(false)}>
                    <div className="detail-sheet" onClick={e => e.stopPropagation()}>
                        <div className="pull-bar" />

                        <button className="ds-close-btn" onClick={() => setIsDetailOpen(false)}>
                            ×
                        </button>

                        {/* Unified Header */}
                        <div className="ds-header">
                            <div className="ds-icon-col">
                                <div className="ds-icon">
                                    {imageErrors.has(currentApp.id) ? (
                                        <MysteryBlock />
                                    ) : (
                                        <img
                                            src={`https://www.google.com/s2/favicons?sz=128&domain=${new URL(currentApp.url).hostname}`}
                                            alt=""
                                            onError={() => setImageErrors(prev => new Set(prev).add(currentApp.id))}
                                        />
                                    )}
                                </div>
                                <span className="ds-genre-chip">{currentApp.genre || 'Other'}</span>
                            </div>
                            <div className="ds-info">
                                <p className="ds-eyebrow">{currentApp.tagline}</p>
                                <h1 className="ds-name">{currentApp.name}</h1>
                            </div>
                        </div>

                        {/* Action Buttons Unified */}
                        <div className="ds-action-bar">
                            <div className="sd-stats" style={{ width: '100%', justifyContent: 'space-between', padding: '0 8px' }}>
                                <div className="sd-vote-group">
                                    <button className={`sd-vote-btn ${userVotesMap[currentApp.id] === 1 ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleVote('up'); }}>+</button>
                                    <span className="sd-vote-count">{currentApp.likesCount || 0}</span>
                                    <button className={`sd-vote-btn ${userVotesMap[currentApp.id] === -1 ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleVote('down'); }}>-</button>
                                </div>

                                <div className="ds-action-right-group">
                                    <button className="ds-reload-btn" onClick={() => {
                                        if (iframeRefs.current[currentApp.id]) {
                                            iframeRefs.current[currentApp.id]!.src = currentApp.url;
                                            setIsDetailOpen(false);
                                        }
                                    }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-svg">
                                            <path d="M23 4v6h-6"></path>
                                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                                        </svg>
                                    </button>

                                    <span
                                        className={`sd-save-btn ${savedAppIds.includes(currentApp.id) ? 'active' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); onToggleSave(currentApp.id); }}
                                    >
                                        ★
                                    </span>

                                    <button className="ds-visit-btn-pill" onClick={() => {
                                        window.open(currentApp.url, '_blank');
                                    }}>
                                        🚀 Visit
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Content */}
                        <div className="ds-content-section">
                            <div className="ds-analysis">
                                {currentApp.analysis.map((line, i) => (
                                    <div key={i} className="ds-analysis-line">{line}</div>
                                ))}
                            </div>
                            <div className="ds-chips">
                                {(currentApp.poster_name || (currentApp.created_by && currentApp.created_by !== 'system')) && (
                                    <div className="ds-chip">
                                        <label>投稿者</label>
                                        <span>{currentApp.poster_name || (currentApp.created_by === deviceId || (userId && currentApp.created_by === userId) ? (userName || 'あなた') : 'ユーザー')}</span>
                                    </div>
                                )}
                                {currentApp.merit && (
                                    <div className="ds-chip">
                                        <label>生存戦略</label>
                                        <span>{currentApp.merit}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comments Section */}
                        <CommentsPanel
                            appId={currentApp.id}
                            appName={currentApp.name}
                            isEmbedded={true}
                        />
                    </div>
                </div>
            )}

            {/* Site List Overlay */}
            {
                isListOpen && (
                    <div className="list-overlay" onClick={() => setIsListOpen(false)}>
                        <div className="list-container" onClick={e => e.stopPropagation()}>
                            <div className="list-header">
                                <h2>サイト検索</h2>
                                <button className="list-close" onClick={() => setIsListOpen(false)}>×</button>
                            </div>
                            <div className="search-box-container">
                                <input type="text" className="search-input" placeholder="例: Saturn, AI, Excel..." />
                            </div>
                            <div className="app-grid">
                                {apps.map((app, index) => (
                                    <div
                                        key={app.id}
                                        className={`app-card ${index === resolvedActiveIndex ? 'active' : ''}`}
                                        onClick={() => {
                                            goTo(index);
                                            setIsListOpen(false);
                                        }}
                                    >
                                        <div className="app-card-icon">
                                            {app.url === 'internal:home' || imageErrors.has(app.id) ? (
                                                <MysteryBlock />
                                            ) : (
                                                <img
                                                    src={`https://www.google.com/s2/favicons?sz=64&domain=${new URL(app.url).hostname}`}
                                                    alt={app.name}
                                                    onError={() => setImageErrors(prev => new Set(prev).add(app.id))}
                                                />
                                            )}
                                        </div>
                                        <div className="app-card-info">
                                            <div className="app-card-text">
                                                <h3>{app.name}</h3>
                                                <span className="app-card-category">{app.genre}</span>
                                                <p>{app.tagline}</p>
                                            </div>
                                            <div className="app-card-action-col">
                                                <span className="app-card-votes">
                                                    {app.likesCount && app.likesCount !== 0 ? (app.likesCount > 0 ? `+${app.likesCount}` : app.likesCount) : ''}
                                                </span>
                                                <button
                                                    className="app-card-visit-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(app.url, '_blank');
                                                    }}
                                                >
                                                    VISIT
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* My Page Component */}
            {
                isMyPageOpen && (
                    <MyPage
                        initialTab={myPageTab}
                        onClose={() => setIsMyPageOpen(false)}
                        savedApps={apps.filter(a => savedAppIds.includes(a.id))}
                        myPostedApps={apps.filter(a => a.created_by === deviceId || (userId && a.created_by === userId))}
                        onAddSite={async (appData) => {
                            const result = await onAddSite(appData);
                            if (!result || result.success !== false) {
                                showToast('Site posted! 🚀');
                            }
                            return result;
                        }}
                        onUpdateSite={async (id, appData) => {
                            await onUpdateSite(id, appData);
                            showToast('Site updated! ✨');
                        }}
                        onRemoveSite={onRemoveSite}
                        onResetSeen={onResetSeen}
                    />
                )
            }

            {/* Board Overlay */}
            {isBoardOpen && <BBSPanel onClose={() => setIsBoardOpen(false)} />}

        </div >
    );
};

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { AppMeta } from '../hooks/useApps';
import './TheFlow.css';

const HomeView = () => (
    <div className="home-view">
        <div className="home-content">
            <div className="home-band">
                <h1 className="home-title">Pirasa</h1>
                <p className="home-subtitle">Sophisticated Curation Hub</p>
            </div>

            <div className="tutorial-grid">
                <div className="tutorial-item vertical">
                    <div className="gesture-icon">✦</div>
                    <div className="gesture-text">
                        <strong>NAVIGATE</strong>
                        <span>「帯」を上下にスライド</span>
                    </div>
                </div>
                <div className="tutorial-item horizontal">
                    <div className="gesture-icon">←</div>
                    <div className="gesture-text">
                        <strong>SITE LIST</strong>
                        <span>全サイトをグリッド表示</span>
                    </div>
                </div>
                <div className="tutorial-item horizontal">
                    <div className="gesture-icon">→</div>
                    <div className="gesture-text">
                        <strong>MY PAGE</strong>
                        <span>保存履歴や設定を確認</span>
                    </div>
                </div>
                <div className="tutorial-item action">
                    <div className="gesture-icon">✥</div>
                    <div className="gesture-text">
                        <strong>ACTION HUB</strong>
                        <span>最下部から直接アクション</span>
                    </div>
                </div>
            </div>

            <div className="home-footer">
                <p>上下の余白、または<strong>最下部のタブ帯</strong>をスワイプして操作</p>
                <div className="scroll-indicator">↑</div>
            </div>
        </div>
    </div>
);

interface Props {
    apps: AppMeta[];
    onOpenAdmin: () => void;
}

const SWIPE_THRESHOLD = 40;

export const TheFlow: React.FC<Props> = ({ apps, onOpenAdmin }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isListOpen, setIsListOpen] = useState(false);
    const [isMyPageOpen, setIsMyPageOpen] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [toast, setToast] = useState<string | null>(null);

    // Interaction State (Ghost UI)
    const [isInteracting, setIsInteracting] = useState(false);
    const [interactionPos, setInteractionPos] = useState({ x: 50, y: 50 });

    // Iframe Refs to handle navigation
    const iframeRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({});

    const isAnimating = useRef(false);
    const activeIndexRef = useRef(activeIndex);
    activeIndexRef.current = activeIndex;

    const containerRef = useRef<HTMLDivElement>(null);

    // Gesture tracking
    const gestureStart = useRef({ x: 0, y: 0, time: 0 });

    const total = apps.length;
    const totalRef = useRef(total);
    totalRef.current = total;

    useEffect(() => {
        if (activeIndex >= total && total > 0) setActiveIndex(total - 1);
    }, [total, activeIndex]);


    const goTo = useCallback((nextIndex: number) => {
        if (nextIndex < 0 || nextIndex >= totalRef.current || isAnimating.current) return;
        isAnimating.current = true;
        setDragOffset({ x: 0, y: 0 });
        setActiveIndex(nextIndex);
        setTimeout(() => { isAnimating.current = false; }, 450);
    }, []);

    // ── Gesture Helpers (Ghost UI: Margin-Only) ───────────────────────

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2000);
    };

    const handleVote = (type: 'up' | 'down') => {
        console.log(`${type === 'up' ? 'Upvoted' : 'Downvoted'}:`, apps[activeIndexRef.current].name);
        if (navigator.vibrate) navigator.vibrate([30, 50]);
        // Visual feedback for voting can be added here
    };

    const handleStart = (clientX: number, clientY: number) => {
        // Allow interaction from anywhere on the screen
        gestureStart.current = { x: clientX, y: clientY, time: Date.now() };
        setIsInteracting(true);
        setInteractionPos({
            x: (clientX / window.innerWidth) * 100,
            y: (clientY / window.innerHeight) * 100
        });
    };

    const handleMove = (clientX: number, clientY: number) => {
        if (!isInteracting) return;

        const dx = clientX - gestureStart.current.x;
        const dy = clientY - gestureStart.current.y;

        setInteractionPos({
            x: (clientX / window.innerWidth) * 100,
            y: (clientY / window.innerHeight) * 100
        });

        setDragOffset({ x: dx, y: dy });
    };

    const handleEnd = () => {
        if (!isInteracting) return;

        const dx = dragOffset.x;
        const dy = dragOffset.y;

        setIsInteracting(false);
        setDragOffset({ x: 0, y: 0 });

        // Swipe detected
        if (Math.abs(dy) > Math.abs(dx)) {
            if (dy < -SWIPE_THRESHOLD) goTo(activeIndexRef.current + 1);
            else if (dy > SWIPE_THRESHOLD) goTo(activeIndexRef.current - 1);
        } else {
            if (Math.abs(dx) > SWIPE_THRESHOLD) {
                handleVote(dx < 0 ? 'down' : 'up');
            }
        }
    };
    // ── Tab Bar Gestures ──────────────────────────────────────────
    const tabGestureStart = useRef({ x: 0, y: 0, time: 0 });
    const [isTabInteracting, setIsTabInteracting] = useState(false);
    const [tabDragOffset, setTabDragOffset] = useState({ x: 0, y: 0 });

    const onTabStart = (clientX: number, clientY: number) => {
        tabGestureStart.current = { x: clientX, y: clientY, time: Date.now() };
        setIsTabInteracting(true);
        setTabDragOffset({ x: 0, y: 0 });
    };

    const onTabMove = (clientX: number, clientY: number) => {
        if (!isTabInteracting) return;
        const dx = clientX - tabGestureStart.current.x;
        const dy = clientY - tabGestureStart.current.y;
        setTabDragOffset({ x: dx, y: dy });
    };

    const onTabEnd = () => {
        if (!isTabInteracting) return;
        const dx = tabDragOffset.x;
        const dy = tabDragOffset.y;
        setIsTabInteracting(false);
        setTabDragOffset({ x: 0, y: 0 });

        if (Math.abs(dy) > Math.abs(dx)) {
            // Vertical: Navigation
            if (dy < -20) goTo(activeIndexRef.current + 1);
            else if (dy > 20) goTo(activeIndexRef.current - 1);
        } else {
            // Horizontal: List & MyPage
            if (dx < -40) setIsListOpen(true);
            else if (dx > 40) setIsMyPageOpen(true);
        }
    };

    // ── Mouse Support (PC) ───────────────────────────────────────────
    const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchEnd = () => handleEnd();

    const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
    const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();

    useEffect(() => {
        const moveHandler = (e: MouseEvent) => {
            onMouseMove(e as any);
            if (isTabInteracting) onTabMove(e.clientX, e.clientY);
        };
        const upHandler = () => {
            onMouseUp();
            if (isTabInteracting) onTabEnd();
        };
        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
        return () => {
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
        };
    }, [isInteracting, isTabInteracting, dragOffset, tabDragOffset]);

    if (total === 0) {
        return (
            <div className="flow-empty">
                <p>サイトが登録されていません</p>
                <button onClick={onOpenAdmin}>＋ サイトを追加する</button>
            </div>
        );
    }

    const currentApp = apps[activeIndex];

    // Safety check: if currentApp is gone (e.g. index sync issue), don't crash the render
    if (total > 0 && !currentApp) return null;

    return (
        <div
            className="flow-root"
            ref={containerRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
        >
            {/* Main Content: Slide Stack */}
            <div className="view-container">
                <div className="slide-stack"
                    style={{
                        transform: `translateY(-${activeIndex * 100}vh)`,
                        transition: isAnimating.current ? 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
                    }}
                >
                    {apps.map((app, index) => (
                        <div key={app.id} className="slide">
                            {app.url === 'internal:home' ? (
                                <HomeView />
                            ) : Math.abs(index - activeIndex) <= 1 ? (
                                <iframe
                                    ref={el => { iframeRefs.current[app.id] = el; }}
                                    src={app.url}
                                    title={app.name}
                                    className="app-iframe"
                                    loading={index === activeIndex ? 'eager' : 'lazy'}
                                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                />
                            ) : (
                                <div className="slide-placeholder" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Ghost Iris (Interaction Feedback) - Hidden on Home */}
            {activeIndex !== 0 && (
                <div
                    className={`ghost-iris ${isInteracting ? 'visible' : ''}`}
                    style={{
                        left: `${interactionPos.x}%`,
                        top: `${interactionPos.y}%`,
                        filter: (() => {
                            const dx = dragOffset.x;
                            const dy = dragOffset.y;
                            const adx = Math.abs(dx);
                            const ady = Math.abs(dy);

                            if (ady > adx && ady > SWIPE_THRESHOLD) {
                                return dy < 0 ? 'hue-rotate(45deg) brightness(1.2) drop-shadow(0 0 15px rgba(212,175,55,0.6))' : 'brightness(0.8) drop-shadow(0 0 15px rgba(255,255,255,0.4))';
                            }
                            if (adx > ady && adx > SWIPE_THRESHOLD) {
                                return dx < 0 ? 'grayscale(1) brightness(0.7)' : 'hue-rotate(10deg) brightness(1.5) drop-shadow(0 0 15px rgba(212,175,55,0.8))';
                            }
                            return 'none';
                        })()
                    }}
                >
                    <div className="controller-ring">
                        <div className="controller-iris" />
                    </div>
                </div>
            )}

            {/* Action-Oriented Tab Bar */}
            <nav
                className={`bottom-tab-bar actions ${isTabInteracting ? 'active' : ''}`}
                onTouchStart={(e) => onTabStart(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchMove={(e) => onTabMove(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={onTabEnd}
                onMouseDown={(e) => onTabStart(e.clientX, e.clientY)}
            >
                <button className="tab-item vote-info" onClick={() => setIsDetailOpen(true)}>
                    <span className="tab-icon">✦</span>
                    <span className="tab-label">Information</span>
                </button>
                <button className="tab-item vote-up" onClick={() => handleVote('up')}>
                    <span className="tab-icon">♥</span>
                    <span className="tab-label">Like</span>
                </button>
                <button className="tab-item vote-comment" onClick={() => showToast('Feature Coming Soon ✒')}>
                    <span className="tab-icon">✒</span>
                    <span className="tab-label">Comment</span>
                </button>
                <button className="tab-item vote-visit" onClick={() => window.open(currentApp.url, '_blank')}>
                    <span className="tab-icon">↗</span>
                    <span className="tab-label">Visit</span>
                </button>
                <button className="tab-item vote-save" onClick={() => showToast('Saved to Library ✥')}>
                    <span className="tab-icon">✥</span>
                    <span className="tab-label">Save</span>
                </button>
            </nav>

            {/* Toast Feedback */}
            {toast && <div className="pirasa-toast">{toast}</div>}

            {/* Progress dots */}
            <div className="progress-dots">
                {apps.map((_, i) => (
                    <div key={i} className={`dot ${i === activeIndex ? 'dot-active' : ''}`} />
                ))}
            </div>

            {/* Detail overlay */}
            {isDetailOpen && (
                <div className="detail-overlay" onClick={() => setIsDetailOpen(false)}>
                    <div className="detail-sheet" onClick={e => e.stopPropagation()}>
                        <div className="pull-bar" />
                        <p className="ds-eyebrow">{currentApp.tagline}</p>
                        <h1 className="ds-name">{currentApp.name}</h1>
                        <p className="ds-section-title">pirasa の目利き</p>
                        <div className="ds-analysis">
                            {currentApp.analysis.map((line, i) => (
                                <div key={i} className="ds-analysis-line">{line}</div>
                            ))}
                        </div>
                        <div className="ds-chips">
                            {currentApp.revenue && (
                                <div className="ds-chip">
                                    <label>収益モデル</label>
                                    <span>{currentApp.revenue}</span>
                                </div>
                            )}
                            {currentApp.merit && (
                                <div className="ds-chip">
                                    <label>生存戦略</label>
                                    <span>{currentApp.merit}</span>
                                </div>
                            )}
                        </div>

                        <div className="ds-actions-grid">
                            <button className="ds-btn-secondary" onClick={() => {
                                if (iframeRefs.current[currentApp.id]) {
                                    iframeRefs.current[currentApp.id]!.src = currentApp.url;
                                    setIsDetailOpen(false);
                                }
                            }}>
                                サイトを再読み込み
                            </button>
                            <button className="ds-btn-primary" onClick={() => {
                                window.open(currentApp.url, '_blank');
                            }}>
                                サイトを開く
                            </button>
                        </div>

                        <button className="ds-close-light" onClick={() => setIsDetailOpen(false)}>
                            閉じる
                        </button>
                    </div>
                </div>
            )}

            {/* Site List Overlay */}
            {isListOpen && (
                <div className="list-overlay" onClick={() => setIsListOpen(false)}>
                    <div className="list-container" onClick={e => e.stopPropagation()}>
                        <div className="list-header">
                            <h2>サイト一覧</h2>
                            <button className="list-close" onClick={() => setIsListOpen(false)}>×</button>
                        </div>
                        <div className="app-grid">
                            {apps.map((app, index) => (
                                <div
                                    key={app.id}
                                    className={`app-card ${index === activeIndex ? 'active' : ''}`}
                                    onClick={() => {
                                        goTo(index);
                                        setIsListOpen(false);
                                    }}
                                >
                                    <div className="app-card-icon">
                                        {app.url === 'internal:home' ? '🏠' : app.name[0]}
                                    </div>
                                    <div className="app-card-info">
                                        <h3>{app.name}</h3>
                                        <p>{app.tagline}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* My Page Overlay */}
            {isMyPageOpen && (
                <div className="list-overlay" onClick={() => setIsMyPageOpen(false)}>
                    <div className="list-container" onClick={e => e.stopPropagation()}>
                        <div className="list-header">
                            <h2>マイページ</h2>
                            <button className="list-close" onClick={() => setIsMyPageOpen(false)}>×</button>
                        </div>
                        <div className="mypage-content">
                            <div className="mypage-profile">
                                <div className="profile-avatar">👤</div>
                                <div className="profile-info">
                                    <h3>Pirasa User</h3>
                                    <p>探索したサイト: 42</p>
                                </div>
                            </div>
                            <div className="mypage-stats">
                                <div className="stat-card">
                                    <label>いいね</label>
                                    <span>28</span>
                                </div>
                                <div className="stat-card">
                                    <label>保存</label>
                                    <span>15</span>
                                </div>
                            </div>
                            <button className="ds-btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => onOpenAdmin()}>
                                管理画面を開く
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

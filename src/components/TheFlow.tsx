import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { AppMeta } from '../hooks/useApps';
import { GENRES } from '../hooks/useApps';
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
                <p><strong>最下部のタブ帯（帯）</strong>をスワイプして操作</p>
                <div className="scroll-indicator">↑</div>
            </div>
        </div>
    </div>
);

interface Props {
    apps: AppMeta[];
    deviceId: string;
    savedAppIds: string[];
    onOpenAdmin: () => void;
    onIncrementLike: (id: string) => void;
    onToggleSave: (id: string) => void;
    onAddSite: (app: Omit<AppMeta, 'id'>) => Promise<void>;
}

// const SWIPE_THRESHOLD = 40; // Unused

export const TheFlow: React.FC<Props> = ({
    apps,
    deviceId,
    savedAppIds,
    onOpenAdmin,
    onIncrementLike,
    onToggleSave,
    onAddSite
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isListOpen, setIsListOpen] = useState(false);
    const [isMyPageOpen, setIsMyPageOpen] = useState(false);
    const [myPageTab, setMyPageTab] = useState<'saved' | 'posts' | 'add'>('saved');
    const [postForm, setPostForm] = useState({
        name: '',
        url: '',
        tagline: '',
        analysis: ['', '', ''],
        revenue: '',
        merit: '',
        genre: ''
    });
    const [toast, setToast] = useState<string | null>(null);
    const [isTabInteracting, setIsTabInteracting] = useState(false);
    const [tabDragOffset, setTabDragOffset] = useState({ x: 0, y: 0 });

    const iframeRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({});
    const isAnimating = useRef(false);
    const activeIndexRef = useRef(activeIndex);
    activeIndexRef.current = activeIndex;
    const containerRef = useRef<HTMLDivElement>(null);
    const total = apps.length;
    const totalRef = useRef(total);
    totalRef.current = total;
    const tabGestureStart = useRef({ x: 0, y: 0, time: 0 });
    const lastWheelTime = useRef(0);

    const WHEEL_COOLDOWN = 600;
    const WHEEL_THRESHOLD = 30;

    useEffect(() => {
        if (activeIndex >= total && total > 0) setActiveIndex(total - 1);
    }, [total, activeIndex]);

    const goTo = useCallback((nextIndex: number) => {
        if (nextIndex < 0 || nextIndex >= totalRef.current || isAnimating.current) return;
        isAnimating.current = true;
        setActiveIndex(nextIndex);
        setTimeout(() => { isAnimating.current = false; }, 450);
    }, []);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2000);
    };

    const handleVote = (type: 'up' | 'down') => {
        const currentApp = apps[activeIndexRef.current];
        if (!currentApp) return;
        if (type === 'up') {
            onIncrementLike(currentApp.id);
            showToast('Liked! ♥');
        }
    };

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
            if (dy < -20) goTo(activeIndexRef.current + 1);
            else if (dy > 20) goTo(activeIndexRef.current - 1);
        } else {
            if (dx < -40) setIsListOpen(true);
            else if (dx > 40) setIsMyPageOpen(true);
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        const now = Date.now();
        if (now - lastWheelTime.current < WHEEL_COOLDOWN) return;

        const { deltaX, deltaY } = e;

        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            // Vertical: Navigation
            if (Math.abs(deltaY) > WHEEL_THRESHOLD) {
                if (deltaY > 0) goTo(activeIndexRef.current + 1);
                else if (deltaY < 0) goTo(activeIndexRef.current - 1);
                lastWheelTime.current = now;
            }
        } else {
            // Horizontal: List & MyPage
            if (Math.abs(deltaX) > WHEEL_THRESHOLD) {
                if (deltaX > 0) setIsListOpen(true);
                else setIsMyPageOpen(true);
                lastWheelTime.current = now;
            }
        }
    };

    useEffect(() => {
        const moveHandler = (e: MouseEvent) => {
            if (isTabInteracting) onTabMove(e.clientX, e.clientY);
        };
        const upHandler = () => {
            if (isTabInteracting) onTabEnd();
        };
        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
        return () => {
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
        };
    }, [isTabInteracting, tabDragOffset]);

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
    if (total > 0 && !currentApp) {
        return (
            <div className="flow-empty">
                <p>サイトを読み込んでいます...</p>
                <div className="loader">✦</div>
            </div>
        );
    }

    return (
        <div
            className="flow-root"
            ref={containerRef}
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


            {/* Action-Oriented Tab Bar */}
            <nav
                className={`bottom-tab-bar actions ${isTabInteracting ? 'active' : ''}`}
                onTouchStart={(e) => onTabStart(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchMove={(e) => onTabMove(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={onTabEnd}
                onMouseDown={(e) => onTabStart(e.clientX, e.clientY)}
                onWheel={handleWheel}
            >
                <button className="tab-item vote-info" onClick={() => setIsDetailOpen(true)}>
                    <span className="tab-icon">✦</span>
                    <span className="tab-label">Information</span>
                </button>
                <button className="tab-item vote-up" onClick={() => handleVote('up')}>
                    <span className="tab-icon">♥</span>
                    <span className="tab-label">{currentApp.likesCount || 0} Likes</span>
                </button>
                <button className="tab-item vote-comment" onClick={() => showToast('Feature Coming Soon ✒')}>
                    <span className="tab-icon">✒</span>
                    <span className="tab-label">Comment</span>
                </button>
                <button className="tab-item vote-visit" onClick={() => window.open(currentApp.url, '_blank')}>
                    <span className="tab-icon">↗</span>
                    <span className="tab-label">Visit</span>
                </button>
                <button
                    className={`tab-item vote-save ${savedAppIds.includes(currentApp.id) ? 'active' : ''}`}
                    onClick={() => onToggleSave(currentApp.id)}
                >
                    <span className="tab-icon">{savedAppIds.includes(currentApp.id) ? '★' : '✥'}</span>
                    <span className="tab-label">{savedAppIds.includes(currentApp.id) ? 'Saved' : 'Save'}</span>
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
                        <h1 className="ds-name">
                            {currentApp.name}
                            {currentApp.genre && <span className="ds-genre-tag">{currentApp.genre}</span>}
                        </h1>
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
                                        <h3>
                                            {app.name}
                                            {app.genre && <span className="app-card-genre">{app.genre}</span>}
                                        </h3>
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
                        <div className="mypage-nav">
                            <button
                                className={`mypage-tab-btn ${myPageTab === 'saved' ? 'active' : ''}`}
                                onClick={() => setMyPageTab('saved')}
                            >
                                保存済み
                            </button>
                            <button
                                className={`mypage-tab-btn ${myPageTab === 'posts' ? 'active' : ''}`}
                                onClick={() => setMyPageTab('posts')}
                            >
                                自分の投稿
                            </button>
                            <button
                                className={`mypage-tab-btn ${myPageTab === 'add' ? 'active' : ''}`}
                                onClick={() => setMyPageTab('add')}
                            >
                                サイトを推薦
                            </button>
                        </div>

                        <div className="mypage-scroll-area">
                            {myPageTab === 'saved' && (
                                <div className="app-grid">
                                    {apps.filter(a => savedAppIds.includes(a.id)).length === 0 ? (
                                        <p className="empty-msg">保存したサイトはありません。</p>
                                    ) : (
                                        apps.filter(a => savedAppIds.includes(a.id)).map((app) => (
                                            <div key={app.id} className="app-card" onClick={() => {
                                                const idx = apps.findIndex(a => a.id === app.id);
                                                if (idx !== -1) {
                                                    goTo(idx);
                                                    setIsMyPageOpen(false);
                                                }
                                            }}>
                                                <div className="app-card-icon">{app.name[0]}</div>
                                                <div className="app-card-info">
                                                    <h3>{app.name}</h3>
                                                    <p>{app.tagline}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {myPageTab === 'posts' && (
                                <div className="app-grid">
                                    {apps.filter(a => a.created_by === deviceId).length === 0 ? (
                                        <p className="empty-msg">まだ投稿していません。</p>
                                    ) : (
                                        apps.filter(a => a.created_by === deviceId).map((app) => (
                                            <div key={app.id} className="app-card">
                                                <div className="app-card-icon">{app.name[0]}</div>
                                                <div className="app-card-info">
                                                    <h3>{app.name}</h3>
                                                    <p>{app.likesCount || 0} Likes</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {myPageTab === 'add' && (
                                <form className="mypage-form" onSubmit={async (e) => {
                                    e.preventDefault();
                                    await onAddSite({
                                        ...postForm,
                                        analysis: postForm.analysis.filter(a => a.trim() !== '')
                                    });
                                    setPostForm({
                                        name: '',
                                        url: '',
                                        tagline: '',
                                        analysis: ['', '', ''],
                                        revenue: '',
                                        merit: '',
                                        genre: ''
                                    });
                                    setMyPageTab('posts');
                                    showToast('Site posted! 🚀');
                                }}>
                                    <div className="form-group">
                                        <label>サイト名 *</label>
                                        <input
                                            value={postForm.name}
                                            onChange={e => setPostForm({ ...postForm, name: e.target.value })}
                                            required
                                            placeholder="例: Saturn"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>URL *</label>
                                        <input
                                            value={postForm.url}
                                            onChange={e => setPostForm({ ...postForm, url: e.target.value })}
                                            required
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>キャッチコピー</label>
                                        <input
                                            value={postForm.tagline}
                                            onChange={e => setPostForm({ ...postForm, tagline: e.target.value })}
                                            placeholder="AIが動くExcel..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>ジャンル *</label>
                                        <select
                                            value={postForm.genre}
                                            onChange={e => setPostForm({ ...postForm, genre: e.target.value })}
                                            required
                                        >
                                            <option value="">選択してください</option>
                                            {GENRES.map(g => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button type="submit" className="form-submit-btn">投稿する</button>
                                </form>
                            )}
                        </div>

                        <div className="mypage-footer">
                            <p>Device ID: {deviceId}</p>
                            <p onDoubleClick={onOpenAdmin} style={{ cursor: 'pointer', opacity: 0.3 }}>Admin</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { type AppMeta, GENRES } from '../hooks/useApps';
import { useAuth } from '../hooks/useAuth';
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
    userId?: string;
    onOpenAdmin: () => void;
    onIncrementLike: (id: string) => void;
    onDecrementLike: (id: string) => void;
    onToggleSave: (id: string) => void;
    onAddSite: (app: Omit<AppMeta, 'id'>) => Promise<void>;
}

export const TheFlow: React.FC<Props> = ({
    apps,
    deviceId,
    savedAppIds,
    onOpenAdmin,
    onIncrementLike,
    onDecrementLike,
    onToggleSave,
    onAddSite
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isSmallDetailOpen, setIsSmallDetailOpen] = useState(false);
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
    const { user, signInWithGoogle, signOut } = useAuth();

    const iframeRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({});
    const isAnimating = useRef(false);
    const activeIndexRef = useRef(activeIndex);
    activeIndexRef.current = activeIndex;
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
        const currentApp = apps[activeIndex];
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

    const handleGestureEnd = (y: number) => {
        if (!touchStart.current) return;
        const deltaY = y - touchStart.current.y;
        const deltaTime = Date.now() - touchStart.current.time;
        touchStart.current = null;

        if (Math.abs(deltaY) > SWIPE_THRESHOLD && deltaTime < 500) {
            if (deltaY < 0) {
                goTo(activeIndexRef.current + 1);
            } else {
                goTo(activeIndexRef.current - 1);
            }
        }
    };

    useEffect(() => {
        const nav = document.querySelector('.bottom-nav-bar');
        if (!nav) return;

        const onStart = (e: TouchEvent | MouseEvent) => {
            const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
            handleGestureStart(y);
        };

        const onEnd = (e: TouchEvent | MouseEvent) => {
            const y = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
            handleGestureEnd(y);
        };

        let wheelTimeout: ReturnType<typeof setTimeout> | null = null;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (isAnimating.current || wheelTimeout) return;

            if (Math.abs(e.deltaY) > 50) {
                if (e.deltaY > 0) {
                    goTo(activeIndexRef.current + 1); // scroll down -> next
                } else {
                    goTo(activeIndexRef.current - 1); // scroll up -> prev
                }

                // Debounce wheel events so it doesn't fly through multiple slides
                wheelTimeout = setTimeout(() => {
                    wheelTimeout = null;
                }, 1000);
            }
        };

        nav.addEventListener('touchstart', onStart as any);
        nav.addEventListener('mousedown', onStart as any);
        window.addEventListener('touchend', onEnd as any);
        window.addEventListener('mouseup', onEnd as any);
        nav.addEventListener('wheel', onWheel as any, { passive: false });

        return () => {
            nav.removeEventListener('touchstart', onStart as any);
            nav.removeEventListener('mousedown', onStart as any);
            window.removeEventListener('touchend', onEnd as any);
            window.removeEventListener('mouseup', onEnd as any);
            nav.removeEventListener('wheel', onWheel as any);
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

    const currentApp = apps[activeIndex];

    if (total > 0 && !currentApp) {
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
                        transform: `translateY(-${activeIndex * 100}dvh)`,
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


            {/* Bottom Navigation Bar */}
            <nav className="bottom-nav-bar">
                <button className="nav-item" onClick={() => setIsListOpen(true)}>
                    <span className="nav-icon">🏠</span>
                    <span className="nav-label">掲示板</span>
                </button>
                <button className="nav-item" onClick={() => showToast('Search coming soon')}>
                    <span className="nav-icon">🔍</span>
                    <span className="nav-label">検索</span>
                </button>
                <button
                    className={`nav-item ${isSmallDetailOpen ? 'active' : ''}`}
                    onClick={() => setIsSmallDetailOpen(!isSmallDetailOpen)}
                >
                    <span className="nav-icon">📋</span>
                    <span className="nav-label">詳細</span>
                </button>
                <button className="nav-item" onClick={() => setIsMyPageOpen(true)}>
                    <span className="nav-icon">👤</span>
                    <span className="nav-label">マイページ</span>
                </button>
            </nav>

            {/* Small Detail Card (Root Level) */}
            {isSmallDetailOpen && currentApp && currentApp.url !== 'internal:home' && (
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
                                    <img src={`https://www.google.com/s2/favicons?sz=128&domain=${new URL(currentApp.url).hostname}`} alt="" />
                                </div>
                                <span className="sd-chip genre-chip">{currentApp.genre || 'Other'}</span>
                            </div>
                            <div className="sd-info">
                                <div className="sd-title-row">
                                    <div className="sd-title">{currentApp.name}</div>
                                </div>
                                {currentApp.merit && (
                                    <div className="sd-chips merit-chips">
                                        <span className="sd-chip">{currentApp.merit}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="sd-right">
                            <div className="sd-stats">
                                <div className="sd-vote-group">
                                    <button className="sd-vote-btn" onClick={(e) => { e.stopPropagation(); handleVote('up'); }}>+</button>
                                    <span className="sd-vote-count">{currentApp.likesCount || 0}</span>
                                    <button className="sd-vote-btn" onClick={(e) => { e.stopPropagation(); handleVote('down'); }}>-</button>
                                </div>
                                <span
                                    className={`sd-save-btn ${savedAppIds.includes(currentApp.id) ? 'active' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); onToggleSave(currentApp.id); }}
                                >
                                    ★ {savedAppIds.includes(currentApp.id) ? 'Saved' : 'Save'}
                                </span>
                            </div>
                            <button className="sd-play-btn" onClick={(e) => { e.stopPropagation(); window.open(currentApp.url, '_blank'); }}>
                                🚀 Visit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className="pirasa-toast">{toast}</div>}

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
                                        {app.url === 'internal:home' ? (
                                            '🏠'
                                        ) : (
                                            <img
                                                src={`https://www.google.com/s2/favicons?sz=64&domain=${new URL(app.url).hostname}`}
                                                alt={app.name}
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                        parent.innerText = app.name[0].toUpperCase();
                                                    }
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div className="app-card-info">
                                        <div className="app-card-text">
                                            <h3>{app.name}</h3>
                                            <span className="app-card-category">{app.genre}</span>
                                            <p>{app.tagline}</p>
                                        </div>
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
                            <div className="mypage-user-info">
                                {user ? (
                                    <div className="user-profile">
                                        <img src={user.user_metadata.avatar_url} alt="avatar" className="user-avatar" />
                                        <div className="user-details">
                                            <span className="user-name">{user.user_metadata.full_name || user.email}</span>
                                            <button className="logout-btn" onClick={signOut}>ログアウト</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button className="google-login-btn" onClick={signInWithGoogle}>
                                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" />
                                        Googleでログイン
                                    </button>
                                )}
                            </div>
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

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { AppMeta } from '../hooks/useApps';
import './TheFlow.css';

const HomeView = () => (
    <div className="home-view">
        <div className="home-content">
            <h1 className="home-title">Pirasa</h1>
            <p className="home-subtitle">Next Generation Zap-App Store</p>

            <div className="tutorial-grid">
                <div className="tutorial-item vertical">
                    <div className="gesture-icon">↑</div>
                    <div className="gesture-text">
                        <strong>NEXT</strong>
                        <span>ロゴを上にスライド</span>
                    </div>
                </div>
                <div className="tutorial-item vertical">
                    <div className="gesture-icon">↓</div>
                    <div className="gesture-text">
                        <strong>PREV</strong>
                        <span>ロゴを下にスライド</span>
                    </div>
                </div>
                <div className="tutorial-item horizontal">
                    <div className="gesture-icon">← / →</div>
                    <div className="gesture-text">
                        <strong>DOWN / UPVOTE</strong>
                        <span>左で低評価、右で高評価</span>
                    </div>
                </div>
                <div className="tutorial-item action">
                    <div className="gesture-icon">●</div>
                    <div className="gesture-text">
                        <strong>DETAILS</strong>
                        <span>タップして詳細（再読込・訪問）</span>
                    </div>
                </div>
                <div className="tutorial-item action">
                    <div className="gesture-icon">●+</div>
                    <div className="gesture-text">
                        <strong>MOVE</strong>
                        <span>ロゴを長押しで移動</span>
                    </div>
                </div>
                <div className="tutorial-item action">
                    <div className="gesture-icon">●●</div>
                    <div className="gesture-text">
                        <strong>SETTINGS</strong>
                        <span>ダブルクリックで設定</span>
                    </div>
                </div>
            </div>

            <div className="home-footer">
                <p>上下の余白エリアをスワイプして操作</p>
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
const LONG_PRESS_DELAY = 500;

export const TheFlow: React.FC<Props> = ({ apps, onOpenAdmin }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Interaction State (Ghost UI)
    const [isInteracting, setIsInteracting] = useState(false);
    const [interactionPos, setInteractionPos] = useState({ x: 50, y: 50 });
    const [isLongPressing, setIsLongPressing] = useState(false);

    // Iframe Refs to handle navigation
    const iframeRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({});

    const isAnimating = useRef(false);
    const lastTapTime = useRef(0);
    const activeIndexRef = useRef(activeIndex);
    activeIndexRef.current = activeIndex;

    const containerRef = useRef<HTMLDivElement>(null);

    // Gesture tracking
    const gestureStart = useRef({ x: 0, y: 0, time: 0 });
    const longPressTimeout = useRef<number | null>(null);

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

    const handleStart = (clientX: number, clientY: number) => {
        // Only allow interaction from top/bottom 80px
        const margin = 80;
        const isMargin = clientY < margin || clientY > window.innerHeight - margin;

        if (!isMargin && activeIndexRef.current !== 0) return; // Allow anywhere on home

        gestureStart.current = { x: clientX, y: clientY, time: Date.now() };
        setIsInteracting(true);
        setInteractionPos({
            x: (clientX / window.innerWidth) * 100,
            y: (clientY / window.innerHeight) * 100
        });

        longPressTimeout.current = window.setTimeout(() => {
            setIsLongPressing(true);
            if (navigator.vibrate) navigator.vibrate(50);
        }, LONG_PRESS_DELAY);
    };

    const handleMove = (clientX: number, clientY: number) => {
        if (!isInteracting) return;

        const dx = clientX - gestureStart.current.x;
        const dy = clientY - gestureStart.current.y;

        setInteractionPos({
            x: (clientX / window.innerWidth) * 100,
            y: (clientY / window.innerHeight) * 100
        });

        if (isLongPressing) {
            // In Ghost UI, "long pressing" just updates the ghost pos
        } else {
            if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                if (longPressTimeout.current) {
                    clearTimeout(longPressTimeout.current);
                    longPressTimeout.current = null;
                }
                setDragOffset({ x: dx, y: dy });
            }
        }
    };

    const handleEnd = () => {
        if (!isInteracting) return;

        const dx = dragOffset.x;
        const dy = dragOffset.y;
        const duration = Date.now() - gestureStart.current.time;

        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current);
            longPressTimeout.current = null;
        }

        setIsLongPressing(false);
        setIsInteracting(false);
        setDragOffset({ x: 0, y: 0 });

        // Tap detected
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 20 && duration < 400) {
            const now = Date.now();
            if (now - lastTapTime.current < 400) {
                onOpenAdmin();
            } else {
                setIsDetailOpen(true);
            }
            lastTapTime.current = now;
            return;
        }

        // Swipe detected
        if (Math.abs(dy) > Math.abs(dx)) {
            if (dy < -SWIPE_THRESHOLD) goTo(activeIndexRef.current + 1);
            else if (dy > SWIPE_THRESHOLD) goTo(activeIndexRef.current - 1);
        } else {
            if (Math.abs(dx) > SWIPE_THRESHOLD) {
                if (dx < -SWIPE_THRESHOLD) console.log('Downvoted');
                else console.log('Upvoted');
                if (navigator.vibrate) navigator.vibrate([30, 50]);
            }
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
        window.addEventListener('mousemove', onMouseMove as any);
        window.addEventListener('mouseup', onMouseUp as any);
        return () => {
            window.removeEventListener('mousemove', onMouseMove as any);
            window.removeEventListener('mouseup', onMouseUp as any);
        };
    }, [isInteracting, dragOffset]);

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
            {/* Slide stack */}
            <div
                className="slide-stack"
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

            {/* Ghost Iris (Appears only while interacting) */}
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
                            return dy < 0 ? 'hue-rotate(120deg) drop-shadow(0 0 15px #00ff00)' : 'hue-rotate(220deg) drop-shadow(0 0 15px #0000ff)';
                        }
                        if (adx > ady && adx > SWIPE_THRESHOLD) {
                            return dx < 0 ? 'hue-rotate(45deg) drop-shadow(0 0 15px #ffff00)' : 'hue-rotate(280deg) drop-shadow(0 0 15px #ff00ff)';
                        }
                        return 'none';
                    })()
                }}
            >
                <div className="controller-ring">
                    <div className="controller-iris" />
                </div>
            </div>

            {/* Gesture feedback hints */}
            {Math.abs(dragOffset.y) > SWIPE_THRESHOLD && (
                <div className="gesture-hint-v">
                    {dragOffset.y < 0 ? 'NEXT' : 'PREV'}
                </div>
            )}
            {Math.abs(dragOffset.x) > SWIPE_THRESHOLD && (
                <div className="gesture-hint-h">
                    {dragOffset.x < 0 ? 'DOWNVOTE' : 'UPVOTE'}
                </div>
            )}

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
        </div>
    );
};

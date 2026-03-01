import React, { useState, useRef, useCallback, useEffect } from 'react';
import { type AppMeta } from '../hooks/useApps';
import './TheFlow.css';

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

    // Controller Position (%, default center-bottom)
    const [pos, setPos] = useState({ x: 50, y: 85 });
    const [isMovingLogo, setIsMovingLogo] = useState(false);

    // Iframe Refs to handle navigation
    const iframeRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({});

    const isAnimating = useRef(false);
    const activeIndexRef = useRef(activeIndex);
    activeIndexRef.current = activeIndex;

    const containerRef = useRef<HTMLDivElement>(null);
    const logoRef = useRef<HTMLDivElement>(null);

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

    // ── Gesture Helpers ──────────────────────────────────────────────

    const handleLogoTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        gestureStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };

        // Long press for dragging
        longPressTimeout.current = window.setTimeout(() => {
            setIsMovingLogo(true);
            if (navigator.vibrate) navigator.vibrate(50);
        }, LONG_PRESS_DELAY);
    };

    const handleLogoTouchMove = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        const dx = touch.clientX - gestureStart.current.x;
        const dy = touch.clientY - gestureStart.current.y;

        if (isMovingLogo) {
            // Reposition mode
            const px = (touch.clientX / window.innerWidth) * 100;
            const py = (touch.clientY / window.innerHeight) * 100;
            setPos({ x: px, y: py });
        } else {
            // Gesture mode
            if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                if (longPressTimeout.current) {
                    clearTimeout(longPressTimeout.current);
                    longPressTimeout.current = null;
                }
            }
            setDragOffset({ x: dx, y: dy });
        }
    };

    const handleLogoTouchEnd = () => {
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current);
            longPressTimeout.current = null;
        }

        if (isMovingLogo) {
            setIsMovingLogo(false);
            setDragOffset({ x: 0, y: 0 });
            return;
        }

        const dx = dragOffset.x;
        const dy = dragOffset.y;
        const duration = Date.now() - gestureStart.current.time;

        // Reset visual offset
        setDragOffset({ x: 0, y: 0 });

        // Tap detected
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && duration < 300) {
            setIsDetailOpen(true);
            return;
        }

        // Swipe detected
        if (Math.abs(dy) > Math.abs(dx)) {
            // Vertical Swipe -> Navigation
            if (dy < -SWIPE_THRESHOLD) goTo(activeIndexRef.current + 1);
            else if (dy > SWIPE_THRESHOLD) goTo(activeIndexRef.current - 1);
        } else {
            // Horizontal Swipe -> Browser History / Reset
            if (Math.abs(dx) > SWIPE_THRESHOLD) {
                if (dx < -SWIPE_THRESHOLD) {
                    // Left Swipe -> Reset to first app (Landing)
                    goTo(0);
                    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
                } else {
                    // Right Swipe -> Future expansion
                    handleHistory('forward');
                }
            }
        }
    };

    const handleHistory = (direction: 'back' | 'forward') => {
        const app = apps[activeIndexRef.current];
        const iframe = iframeRefs.current[app.id];
        if (!iframe) return;

        try {
            // Note: This will likely fail for cross-origin sites due to security restrictions
            if (direction === 'back') iframe.contentWindow?.history.back();
            else iframe.contentWindow?.history.forward();

            // Visual feedback vibration
            if (navigator.vibrate) navigator.vibrate(20);
        } catch (err) {
            console.warn("Cross-origin history access blocked:", err);
        }
    };

    // ── Mouse Support (PC) ───────────────────────────────────────────
    const isMouseDown = useRef(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        gestureStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
        isMouseDown.current = true;
        longPressTimeout.current = window.setTimeout(() => {
            setIsMovingLogo(true);
        }, LONG_PRESS_DELAY);
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isMouseDown.current) return;
            const dx = e.clientX - gestureStart.current.x;
            const dy = e.clientY - gestureStart.current.y;

            if (isMovingLogo) {
                setPos({
                    x: (e.clientX / window.innerWidth) * 100,
                    y: (e.clientY / window.innerHeight) * 100
                });
            } else {
                if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                    if (longPressTimeout.current) {
                        clearTimeout(longPressTimeout.current);
                        longPressTimeout.current = null;
                    }
                }
                setDragOffset({ x: dx, y: dy });
            }
        };

        const onMouseUp = () => {
            if (!isMouseDown.current) return;
            isMouseDown.current = false;
            if (longPressTimeout.current) {
                clearTimeout(longPressTimeout.current);
                longPressTimeout.current = null;
            }
            if (isMovingLogo) {
                setIsMovingLogo(false);
                setDragOffset({ x: 0, y: 0 });
            } else {
                const dx = dragOffset.x;
                const dy = dragOffset.y;
                if (Math.abs(dy) > Math.abs(dx)) {
                    if (dy < -SWIPE_THRESHOLD) goTo(activeIndexRef.current + 1);
                    else if (dy > SWIPE_THRESHOLD) goTo(activeIndexRef.current - 1);
                } else if (Math.abs(dx) > SWIPE_THRESHOLD) {
                    handleHistory(dx > 0 ? 'forward' : 'back');
                }
                setDragOffset({ x: 0, y: 0 });
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isMovingLogo, dragOffset, goTo]);

    if (total === 0) {
        return (
            <div className="flow-empty">
                <p>サイトが登録されていません</p>
                <button onClick={onOpenAdmin}>＋ サイトを追加する</button>
            </div>
        );
    }

    const currentApp = apps[activeIndex];

    return (
        <div className="flow-root" ref={containerRef}>
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
                        {Math.abs(index - activeIndex) <= 1 ? (
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

            {/* Pirasa Controller (Floating Pie Menu) */}
            <div
                ref={logoRef}
                className={`pirasa-controller ${isMovingLogo ? 'moving' : ''}`}
                style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: `translate(-50%, -50%) translate(${dragOffset.x}px, ${dragOffset.y}px)`,
                    filter: `hue-rotate(${activeIndex * 65}deg) drop-shadow(0 0 10px var(--red-glow))`
                }}
                onTouchStart={handleLogoTouchStart}
                onTouchMove={handleLogoTouchMove}
                onTouchEnd={handleLogoTouchEnd}
                onMouseDown={handleMouseDown}
            >
                <div className="controller-ring">
                    <img src="/logo.png" alt="pirasa" className="controller-logo" />
                </div>
            </div>

            {/* Gesture feedback hints */}
            {Math.abs(dragOffset.y) > SWIPE_THRESHOLD && !isMovingLogo && (
                <div className="gesture-hint-v">
                    {dragOffset.y < 0 ? 'NEXT' : 'PREV'}
                </div>
            )}
            {Math.abs(dragOffset.x) > SWIPE_THRESHOLD && !isMovingLogo && (
                <div className="gesture-hint-h">
                    {dragOffset.x < 0 ? 'GO TO START' : 'FORWARD'}
                </div>
            )}

            {/* Progress dots */}
            <div className="progress-dots">
                {apps.map((_, i) => (
                    <div key={i} className={`dot ${i === activeIndex ? 'dot-active' : ''}`} />
                ))}
            </div>

            {/* Settings */}
            <button className="settings-btn" onClick={onOpenAdmin} title="サイト設定">⚙</button>

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
                        <button className="ds-close" onClick={() => setIsDetailOpen(false)}>
                            スワイプを続ける
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { type AppMeta } from '../hooks/useApps';
import './TheFlow.css';

interface Props {
    apps: AppMeta[];
    onOpenAdmin: () => void;
}

const SWIPE_THRESHOLD = 50;
const TAP_MAX_MOVE = 12;
const TAP_MAX_DURATION = 220;

export const TheFlow: React.FC<Props> = ({ apps, onOpenAdmin }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);

    // Use refs for gesture state to avoid stale closures in touch handlers
    const isDragging = useRef(false);
    const isAnimating = useRef(false);
    const touchStartY = useRef(0);
    const touchCurrentY = useRef(0);
    const touchStartTime = useRef(0);

    const activeIndexRef = useRef(activeIndex);
    activeIndexRef.current = activeIndex;

    const swipeZoneRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const total = apps.length;
    const totalRef = useRef(total);
    totalRef.current = total;

    useEffect(() => {
        if (activeIndex >= total && total > 0) setActiveIndex(total - 1);
    }, [total, activeIndex]);

    const goTo = useCallback((nextIndex: number) => {
        if (nextIndex < 0 || nextIndex >= totalRef.current || isAnimating.current) return;
        isAnimating.current = true;
        setDragOffset(0);
        setActiveIndex(nextIndex);
        setTimeout(() => { isAnimating.current = false; }, 450);
    }, []);

    // ── Shared drag logic (used by both zone and 2-finger) ────────────
    const startDrag = (y: number) => {
        touchStartY.current = y;
        touchCurrentY.current = y;
        touchStartTime.current = Date.now();
        isDragging.current = true;
    };

    const moveDrag = (y: number) => {
        if (!isDragging.current || isAnimating.current) return;
        touchCurrentY.current = y;
        const delta = y - touchStartY.current;
        const idx = activeIndexRef.current;
        const tot = totalRef.current;
        const resistance = (idx === 0 && delta > 0) || (idx === tot - 1 && delta < 0) ? 0.2 : 1;
        setDragOffset(delta * resistance);
    };

    const endDrag = (): boolean => {
        if (!isDragging.current) return false;
        isDragging.current = false;
        const delta = touchCurrentY.current - touchStartY.current;
        const dur = Date.now() - touchStartTime.current;
        const isTap = Math.abs(delta) < TAP_MAX_MOVE && dur < TAP_MAX_DURATION;

        if (!isTap) {
            if (delta < -SWIPE_THRESHOLD) goTo(activeIndexRef.current + 1);
            else if (delta > SWIPE_THRESHOLD) goTo(activeIndexRef.current - 1);
            else {
                isAnimating.current = true;
                setDragOffset(0);
                setTimeout(() => { isAnimating.current = false; }, 300);
            }
        } else {
            setDragOffset(0);
        }
        return isTap;
    };

    // ── Bottom gradient swipe zone (1-finger) ─────────────────────────
    const handleZoneTouchStart = (e: React.TouchEvent) => {
        if (isAnimating.current) return;
        e.stopPropagation();
        startDrag(e.touches[0].clientY);
    };

    const handleZoneTouchMove = (e: React.TouchEvent) => {
        e.stopPropagation();
        moveDrag(e.touches[0].clientY);
    };

    const handleZoneTouchEnd = (e: React.TouchEvent) => {
        e.stopPropagation();
        const wasTap = endDrag();
        if (wasTap && swipeZoneRef.current) {
            // Let the tap fall through to the iframe
            swipeZoneRef.current.style.pointerEvents = 'none';
            setTimeout(() => {
                if (swipeZoneRef.current) swipeZoneRef.current.style.pointerEvents = 'auto';
            }, 400);
        }
    };

    // ── 2-finger whole-screen swipe ────────────────────────────────────
    const isMultiTouch = useRef(false);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const onStart = (e: TouchEvent) => {
            if (isAnimating.current || e.touches.length < 2) return;
            e.preventDefault(); // stop pinch-zoom
            isMultiTouch.current = true;
            startDrag(e.touches[0].clientY);
        };

        const onMove = (e: TouchEvent) => {
            if (!isMultiTouch.current) return;
            e.preventDefault();
            moveDrag(e.touches[0].clientY);
        };

        const onEnd = () => {
            if (!isMultiTouch.current) return;
            isMultiTouch.current = false;
            endDrag();
        };

        el.addEventListener('touchstart', onStart, { passive: false });
        el.addEventListener('touchmove', onMove, { passive: false });
        el.addEventListener('touchend', onEnd);
        return () => {
            el.removeEventListener('touchstart', onStart);
            el.removeEventListener('touchmove', onMove);
            el.removeEventListener('touchend', onEnd);
        };
    }, []);

    // ── Mouse wheel (desktop) ─────────────────────────────────────────
    const wheelLock = useRef(false);

    const doWheel = useCallback((deltaY: number) => {
        if (wheelLock.current || isAnimating.current) return;
        wheelLock.current = true;
        if (deltaY > 30) goTo(activeIndexRef.current + 1);
        else if (deltaY < -30) goTo(activeIndexRef.current - 1);
        setTimeout(() => { wheelLock.current = false; }, 700);
    }, [goTo]);

    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        doWheel(e.deltaY);
    }, [doWheel]);

    const handleZoneWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        doWheel(e.deltaY);
    };

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    // ── Mouse drag on swipe zone (PC) ────────────────────────────────
    const mouseDragging = useRef(false);

    const handleZoneMouseDown = (e: React.MouseEvent) => {
        mouseDragging.current = true;
        startDrag(e.clientY);
    };

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!mouseDragging.current) return;
            moveDrag(e.clientY);
        };
        const onUp = () => {
            if (!mouseDragging.current) return;
            mouseDragging.current = false;
            endDrag();
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
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

    const totalTranslate = -activeIndex * 100 + (dragOffset / window.innerHeight) * 100;
    const currentApp = apps[activeIndex];

    return (
        <div
            className="flow-root"
            ref={containerRef}
        >
            {/* Slide stack */}
            <div
                className="slide-stack"
                style={{
                    transform: `translateY(${totalTranslate}vh)`,
                    transition: isDragging.current ? 'none' : 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
                }}
            >
                {apps.map((app, index) => (
                    <div key={app.id} className="slide">
                        {Math.abs(index - activeIndex) <= 1 ? (
                            <iframe
                                src={app.url}
                                title={app.name}
                                className="app-iframe"
                                loading={index === activeIndex ? 'eager' : 'lazy'}
                                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                            />
                        ) : (
                            <div className="slide-placeholder" />
                        )}

                        {/* The gradient doubles as the swipe zone (touch + mouse drag + wheel) */}
                        <div
                            ref={index === activeIndex ? swipeZoneRef : undefined}
                            className="slide-gradient swipe-zone"
                            onTouchStart={handleZoneTouchStart}
                            onTouchMove={handleZoneTouchMove}
                            onTouchEnd={handleZoneTouchEnd}
                            onWheel={handleZoneWheel}
                            onMouseDown={handleZoneMouseDown}
                        />

                        <div className="slide-info">
                            <p className="slide-tagline">{app.tagline}</p>
                            <h2 className="slide-name">{app.name}</h2>
                        </div>

                        <div className="slide-actions">
                            <button className="p-btn" onClick={() => setIsDetailOpen(true)}>
                                <img src="/logo.png" alt="pirasa" />
                            </button>
                            <span className="p-btn-label">pirasa</span>
                        </div>

                        {index === 0 && activeIndex === 0 && (
                            <div className="swipe-hint">
                                <div className="hint-arrow">
                                    <span /><span /><span />
                                </div>
                                <p>ここから上にスワイプ</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

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
                        <p className="ds-eyebrow">pirasa の目利き</p>
                        <h1 className="ds-name">{currentApp.name}</h1>
                        <p className="ds-section-title">3行の鋭い分析</p>
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

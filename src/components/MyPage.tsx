import React from 'react';
import type { AppMeta } from '../hooks/useApps';
import './AdminPanel.css'; // Reuse some base styles

interface Props {
    savedApps: (AppMeta & { originalIndex: number })[];
    onClose: () => void;
    onJump: (index: number) => void;
}

export const MyPage: React.FC<Props> = ({ savedApps, onClose, onJump }) => {
    return (
        <div className="admin-root">
            <header className="admin-header">
                <button className="admin-back" onClick={onClose}>← BACK</button>
                <h1>MY PAGE</h1>
                <div style={{ width: 80 }} />
            </header>

            <div className="admin-list">
                {savedApps.length === 0 ? (
                    <div className="admin-empty" style={{ textAlign: 'center', padding: '100px 20px', color: 'rgba(255,255,255,0.4)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📁</div>
                        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>保存されたサイトはありません</p>
                        <p>気になるサイトを保存してここに集めましょう</p>
                    </div>
                ) : (
                    savedApps.map((app) => (
                        <div key={app.id} className="admin-card" onClick={() => onJump(app.originalIndex)}>
                            <div className="admin-card-info">
                                <span className="admin-card-num">#</span>
                                <div>
                                    <div className="admin-card-name">{app.name}</div>
                                    <div className="admin-card-url">{app.tagline}</div>
                                </div>
                            </div>
                            <div className="admin-card-actions">
                                <button className="ds-btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem', width: 'auto' }}>
                                    GO →
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

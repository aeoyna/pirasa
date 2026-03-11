import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { AppMeta } from '../hooks/useApps';
import './MyPage.css';

interface MyPageProps {
    onClose: () => void;
    savedApps: AppMeta[];
    myPostedApps: AppMeta[];
    onAddSite: (app: Omit<AppMeta, 'id'>) => Promise<void>;
    initialTab?: 'saved' | 'posts' | 'new';
}

export const MyPage: React.FC<MyPageProps> = ({ onClose, savedApps, myPostedApps, onAddSite, initialTab }) => {
    const { user, signInWithGoogle, signOut, updateUsername } = useAuth();
    const [activeTab, setActiveTab] = useState<'saved' | 'posts' | 'new'>(initialTab || 'saved');

    // Username editing state
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInput, setNameInput] = useState('');
    const [nameError, setNameError] = useState('');
    const [nameSaving, setNameSaving] = useState(false);

    const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email || '';

    const handleEditName = () => {
        setNameInput(displayName);
        setNameError('');
        setIsEditingName(true);
    };

    const handleSaveName = async () => {
        const trimmed = nameInput.trim();
        if (!trimmed) { setNameError('名前を入力してください'); return; }
        setNameSaving(true);
        const { error } = await updateUsername(trimmed);
        setNameSaving(false);
        if (error) { setNameError(error); return; }
        setIsEditingName(false);
    };

    // New Site Form State
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [tagline, setTagline] = useState('');
    const [merit, setMerit] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePostSite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onAddSite({
                name,
                url,
                tagline,
                merit,
                revenue: "N/A", // Defaults
                analysis: [],
                genre: "ツール"
            });
            setName('');
            setUrl('');
            setTagline('');
            setMerit('');
            setActiveTab('posts');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return (
            <div className="mypage-overlay panel-slide-in">
                <div className="mypage-container">
                    <button className="mypage-close" onClick={onClose}>×</button>
                    <div className="mypage-auth-view">
                        <h2>My Page</h2>
                        <p>Sign in to save sites, post your own tools, and join the discussion.</p>
                        <button className="google-sign-in-btn" onClick={signInWithGoogle}>
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            Continue with Google
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mypage-overlay panel-slide-in">
            <div className="mypage-container">
                <div className="mypage-header">
                    <h2>My Page</h2>
                    <button className="mypage-close" onClick={onClose}>×</button>
                </div>

                <div className="user-profile-bar">
                    <img src={user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'} alt="Profile" className="user-avatar" />
                    <div className="user-details">
                        {isEditingName ? (
                            <div className="username-edit-row">
                                <input
                                    className="username-input"
                                    value={nameInput}
                                    onChange={e => setNameInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setIsEditingName(false); }}
                                    autoFocus
                                    maxLength={30}
                                    placeholder="ユーザーネーム"
                                />
                                <button className="username-save-btn" onClick={handleSaveName} disabled={nameSaving}>
                                    {nameSaving ? '…' : '✓'}
                                </button>
                                <button className="username-cancel-btn" onClick={() => setIsEditingName(false)}>✕</button>
                            </div>
                        ) : (
                            <div className="username-display-row">
                                <span className="user-name">{displayName}</span>
                                <button className="username-edit-btn" onClick={handleEditName} title="ユーザーネームを変更">✎</button>
                            </div>
                        )}
                        {nameError && <span className="username-error">{nameError}</span>}
                        <button className="sign-out-btn" onClick={signOut}>Sign Out</button>
                    </div>
                </div>

                <div className="mypage-tabs">
                    <button className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>Saved</button>
                    <button className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>My Posts</button>
                    <button className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`} onClick={() => setActiveTab('new')}>+ Post Site</button>
                </div>

                <div className="mypage-content-area">
                    {activeTab === 'saved' && (
                        <div className="app-list">
                            {savedApps.length === 0 ? <p className="empty-state">No saved sites yet.</p> : null}
                            {savedApps.map(app => (
                                <div key={app.id} className="app-list-item">
                                    <div className="app-list-item-title">{app.name}</div>
                                    <div className="app-list-item-merit">{app.merit}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'posts' && (
                        <div className="app-list">
                            {myPostedApps.length === 0 ? <p className="empty-state">You haven't posted any sites.</p> : null}
                            {myPostedApps.map(app => (
                                <div key={app.id} className="app-list-item">
                                    <div className="app-list-item-title">{app.name}</div>
                                    <div className="app-list-item-url">{app.url}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'new' && (
                        <form className="post-site-form" onSubmit={handlePostSite}>
                            <div className="form-group">
                                <label>Site Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Saturn" />
                            </div>
                            <div className="form-group">
                                <label>URL</label>
                                <input type="url" value={url} onChange={e => setUrl(e.target.value)} required placeholder="https://..." />
                            </div>
                            <div className="form-group">
                                <label>Tagline</label>
                                <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} required placeholder="Short catchphrase" />
                            </div>
                            <div className="form-group">
                                <label>Merit (Benefit)</label>
                                <textarea value={merit} onChange={e => setMerit(e.target.value)} required placeholder="Explain why someone should use this..." rows={3} />
                            </div>
                            <button type="submit" className="submit-post-btn" disabled={isSubmitting}>
                                {isSubmitting ? 'Posting...' : 'Post Site'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

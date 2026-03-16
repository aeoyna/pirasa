import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { AppMeta } from '../hooks/useApps';
import { checkIframeAllowed } from '../lib/iframeValidator';
import './MyPage.css';

interface MyPageProps {
    onClose: () => void;
    savedApps: AppMeta[];
    myPostedApps: AppMeta[];
    onAddSite: (app: Omit<AppMeta, 'id'>) => Promise<{ success: boolean; error?: string } | void>;
    onUpdateSite: (id: string, app: Omit<AppMeta, 'id'>) => Promise<void>;
    onRemoveSite: (id: string) => Promise<void>;
    initialTab?: 'saved' | 'posts' | 'new';
}

export const MyPage: React.FC<MyPageProps> = ({ onClose, savedApps, myPostedApps, onAddSite, onUpdateSite, onRemoveSite, initialTab }) => {
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

    // New/Edit Site Form State
    const [editingApp, setEditingApp] = useState<AppMeta | null>(null);
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [tagline, setTagline] = useState('');
    const [merit, setMerit] = useState('');
    const [genre, setGenre] = useState('ツール');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const startEdit = (app: AppMeta) => {
        setEditingApp(app);
        setName(app.name);
        setUrl(app.url);
        setTagline(app.tagline);
        setMerit(app.merit);
        setGenre(app.genre || 'ツール');
        setActiveTab('new');
    };

    const cancelEdit = () => {
        setEditingApp(null);
        setName('');
        setUrl('');
        setTagline('');
        setMerit('');
        setGenre('ツール');
    };

    const handlePostSite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const appData = {
                name,
                url,
                tagline,
                merit,
                analysis: editingApp ? editingApp.analysis : [],
                genre: editingApp ? genre : genre, // Using the state variable
                poster_name: editingApp ? editingApp.poster_name : (displayName || '匿名')
            };

            // iframe check for new sites (not on edit, though you might want to check on edit too)
            if (!editingApp) {
                const check = await checkIframeAllowed(url);
                if (!check.allowed) {
                    alert(`このサイトは登録できません：\n${check.error || '埋め込みが禁止されています。'}`);
                    setIsSubmitting(false);
                    return;
                }
            }

            if (editingApp) {
                await onUpdateSite(editingApp.id, appData);
                setEditingApp(null);
            } else {
                const result = await onAddSite(appData);
                if (result && (result as any).success === false) {
                    alert((result as any).error || '登録に失敗しました');
                    return;
                }
            }

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

    const handleDeleteSite = async (id: string, name: string) => {
        if (window.confirm(`「${name}」を削除してもよろしいですか？`)) {
            await onRemoveSite(id);
        }
    };

    const inputStyle: React.CSSProperties = {
        background: 'rgba(0, 0, 0, 0.06)',
        border: '1px solid rgba(0, 0, 0, 0.15)',
        color: '#000',
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
                    <button
                        className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
                        onClick={() => {
                            if (activeTab !== 'new') cancelEdit();
                            setActiveTab('new');
                        }}
                    >
                        {editingApp ? 'Edit Site' : '+ Post Site'}
                    </button>
                </div>

                <div className="mypage-content-area">
                    {activeTab === 'saved' && (
                        <div className="app-grid">
                            {savedApps.length === 0 ? <p className="empty-state">No saved sites yet.</p> : null}
                            {savedApps.map(app => (
                                <div key={app.id} className="app-grid-item" onClick={() => window.open(app.url, '_blank')}>
                                    <div className="app-grid-icon">
                                        <img
                                            src={`https://www.google.com/s2/favicons?domain=${new URL(app.url).hostname}&sz=128`}
                                            alt={app.name}
                                        />
                                    </div>
                                    <div className="app-grid-title">{app.name}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'posts' && (
                        <div className="app-list">
                            {myPostedApps.length === 0 ? <p className="empty-state">You haven't posted any sites.</p> : null}
                            {myPostedApps.map(app => (
                                <div key={app.id} className="app-list-item">
                                    <div className="app-list-row">
                                        <div className="app-list-main">
                                            <div className="app-list-item-title">{app.name}</div>
                                            <div className="app-list-item-url">{app.url}</div>
                                        </div>
                                        <div className="app-list-actions">
                                            <button className="app-edit-btn" onClick={() => startEdit(app)}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                編集
                                            </button>
                                            <button className="app-delete-btn" onClick={() => handleDeleteSite(app.id, app.name)}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                削除
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'new' && (
                        <form className="post-site-form" onSubmit={handlePostSite}>
                            <div className="form-group">
                                <label>Site Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Saturn" style={inputStyle} />
                            </div>
                            <div className="form-group">
                                <label>URL</label>
                                <input type="url" value={url} onChange={e => setUrl(e.target.value)} required placeholder="https://..." style={inputStyle} />
                            </div>
                            <div className="form-group">
                                <label>Tagline</label>
                                <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} required placeholder="Short catchphrase" style={inputStyle} />
                            </div>
                            <div className="form-group">
                                <label>Merit (Benefit)</label>
                                <textarea value={merit} onChange={e => setMerit(e.target.value)} required placeholder="Explain why someone should use this..." rows={3} style={inputStyle} />
                            </div>
                            <div className="form-group">
                                <label>Genre</label>
                                <select
                                    value={genre}
                                    onChange={e => setGenre(e.target.value)}
                                    style={inputStyle}
                                >
                                    <option value="ツール">ツール</option>
                                    <option value="ミーム">ミーム</option>
                                    <option value="ゲーム">ゲーム</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="submit-post-btn" disabled={isSubmitting}>
                                    {isSubmitting ? 'Processing...' : (editingApp ? 'Save Changes' : 'Post Site')}
                                </button>
                                {editingApp && (
                                    <button type="button" className="cancel-post-btn" onClick={() => setActiveTab('posts')}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

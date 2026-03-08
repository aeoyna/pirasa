import React, { useState } from 'react';
import { type AppMeta, GENRES } from '../hooks/useApps';
import migrateData from '../data/migrate_data.json';
import './AdminPanel.css';

interface Props {
    apps: AppMeta[];
    onAdd: (app: Omit<AppMeta, 'id'>) => void;
    onUpdate: (id: string, app: Omit<AppMeta, 'id'>) => void;
    onRemove: (id: string) => void;
    onClose: () => void;
}

const EMPTY_FORM: Omit<AppMeta, 'id'> = {
    name: '',
    url: '',
    tagline: '',
    analysis: ['', '', ''],
    revenue: '',
    merit: '',
    genre: '',
};

export const AdminPanel: React.FC<Props> = ({ apps, onAdd, onUpdate, onRemove, onClose }) => {
    const [editing, setEditing] = useState<AppMeta | null>(null);
    const [form, setForm] = useState<Omit<AppMeta, 'id'>>(EMPTY_FORM);
    const [view, setView] = useState<'list' | 'form'>('list');

    const openNew = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setView('form');
    };

    const openEdit = (app: AppMeta) => {
        setEditing(app);
        setForm({
            name: app.name,
            url: app.url,
            tagline: app.tagline,
            analysis: [...app.analysis],
            revenue: app.revenue,
            merit: app.merit,
            genre: app.genre || ''
        });
        setView('form');
    };

    const handleSave = () => {
        if (!form.name || !form.url) return;
        const cleanedAnalysis = form.analysis.map(a => a.trim()).filter(Boolean);
        const data = { ...form, analysis: cleanedAnalysis };
        if (editing) {
            onUpdate(editing.id, data);
        } else {
            onAdd(data);
        }
        setView('list');
    };

    const setAnalysisLine = (i: number, value: string) => {
        setForm(prev => {
            const analysis = [...prev.analysis];
            analysis[i] = value;
            return { ...prev, analysis };
        });
    };

    const handleMigrate = () => {
        if (!window.confirm('migrate_data.json からデータをインポートしますか？')) return;

        const existingUrls = new Set(apps.map(a => a.url));
        let count = 0;

        migrateData.forEach((site: any) => {
            if (!existingUrls.has(site.url)) {
                // Remove ID if present to let the hook generate a new one
                const { id, ...appData } = site;
                onAdd(appData);
                count++;
            }
        });

        alert(`${count} 件のサイトをインポートしました。`);
    };

    return (
        <div className="admin-root">
            <div className="admin-header">
                <button className="admin-back" onClick={view === 'form' ? () => setView('list') : onClose}>
                    {view === 'form' ? '← 戻る' : '✕'}
                </button>
                <h1>{view === 'form' ? (editing ? 'サイトを編集' : '新しいサイト') : 'サイト設定'}</h1>
                {view === 'list' && (
                    <div className="admin-actions-group">
                        <button className="admin-migrate-btn" onClick={handleMigrate} title="JSONからインポート">📥</button>
                        <button className="admin-add-btn" onClick={openNew}>＋</button>
                    </div>
                )}
            </div>

            {view === 'list' ? (
                <div className="admin-list">
                    {apps.length === 0 ? (
                        <p className="admin-empty">サイトがありません。「＋」ボタンで追加してください。</p>
                    ) : apps.map((app, i) => (
                        <div key={app.id} className="admin-card">
                            <div className="admin-card-info">
                                <span className="admin-card-num">#{i + 1}</span>
                                <div>
                                    <div className="admin-card-name">{app.name}</div>
                                    <div className="admin-card-url">{app.url}</div>
                                </div>
                            </div>
                            <div className="admin-card-actions">
                                <button onClick={() => openEdit(app)}>編集</button>
                                <button className="admin-delete" onClick={() => onRemove(app.id)}>削除</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="admin-form">
                    <label>サイト名<span>*</span></label>
                    <input
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="例: Excalidraw"
                    />

                    <label>URL<span>*</span></label>
                    <input
                        value={form.url}
                        onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                        placeholder="https://excalidraw.com"
                        type="url"
                    />

                    <label>キャッチコピー</label>
                    <input
                        value={form.tagline}
                        onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                        placeholder="例: 手書き風のコラボ図形ツール。"
                    />

                    <label>pirasa の3行分析</label>
                    {[0, 1, 2].map(i => (
                        <input
                            key={i}
                            value={form.analysis[i] ?? ''}
                            onChange={e => setAnalysisLine(i, e.target.value)}
                            placeholder={`分析 ${i + 1}行目`}
                        />
                    ))}

                    <label>収益モデル</label>
                    <input
                        value={form.revenue}
                        onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))}
                        placeholder="例: フリーミアム (Pro: $9/mo)"
                    />

                    <label>生存戦略のメリット</label>
                    <input
                        value={form.merit}
                        onChange={e => setForm(f => ({ ...f, merit: e.target.value }))}
                        placeholder="例: ブラウザだけで完結する体験。"
                    />

                    <label>ジャンル<span>*</span></label>
                    <select
                        value={form.genre}
                        onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
                        className="admin-select"
                        required
                    >
                        <option value="">選択してください</option>
                        {GENRES.map(g => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>

                    <button
                        className="admin-save"
                        onClick={handleSave}
                        disabled={!form.name || !form.url}
                    >
                        {editing ? '更新する' : '追加する'}
                    </button>
                </div>
            )}
        </div>
    );
};

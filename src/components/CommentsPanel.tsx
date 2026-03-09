import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import './CommentsPanel.css';

interface AppComment {
    id: string;
    app_id: string;
    user_id: string;
    content: string;
    created_at: string;
}

export const CommentsPanel: React.FC<{ appId: string, appName: string, onClose: () => void }> = ({ appId, appName, onClose }) => {
    const { user, signInWithGoogle } = useAuth();
    const [comments, setComments] = useState<AppComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchComments = async () => {
            const { data, error } = await supabase
                .from('app_comments')
                .select('*')
                .eq('app_id', appId)
                .order('created_at', { ascending: true });

            if (!error && data) setComments(data);
            setLoading(false);
        };

        fetchComments();

        const channel = supabase
            .channel(`comments:${appId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_comments', filter: `app_id=eq.${appId}` }, (payload: any) => {
                setComments(prev => [...prev, payload.new as AppComment]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [appId]);

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !content.trim()) return;

        setIsSubmitting(true);
        const { error } = await supabase.from('app_comments').insert([{
            app_id: appId,
            user_id: user.id,
            content: content.trim()
        }]);

        if (!error) {
            setContent('');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="comments-overlay panel-slide-in" onClick={onClose}>
            <div className="comments-container" onClick={e => e.stopPropagation()}>
                <div className="comments-header">
                    <h2>{appName} のコメント</h2>
                    <button className="comments-close" onClick={onClose}>×</button>
                </div>

                <div className="comments-feed">
                    {loading ? (
                        <div className="comments-loading"><div className="loader">✦</div></div>
                    ) : comments.length === 0 ? (
                        <p className="comments-empty">まだコメントがありません。</p>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} className="comment-item">
                                <div className="comment-avatar">
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                                </div>
                                <div className="comment-content-box">
                                    <div className="comment-meta">
                                        <span className="comment-author">User {comment.user_id.substring(0, 5)}</span>
                                        <span className="comment-time">{new Date(comment.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="comment-text">{comment.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="comments-input-area">
                    {user ? (
                        <form className="comments-form" onSubmit={handlePost}>
                            <input
                                type="text"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="コメントを追加..."
                                maxLength={280}
                                disabled={isSubmitting}
                            />
                            <button type="submit" disabled={!content.trim() || isSubmitting}>送信</button>
                        </form>
                    ) : (
                        <button className="comments-login-btn" onClick={signInWithGoogle}>
                            Googleログインしてコメント
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

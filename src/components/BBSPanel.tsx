import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import './BBSPanel.css';

interface BBSPost {
    id: string;
    user_id: string;
    display_name: string;
    avatar_url: string;
    content: string;
    created_at: string;
}

export const BBSPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user, signInWithGoogle } = useAuth();
    const [posts, setPosts] = useState<BBSPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchPosts = async () => {
            const { data, error } = await supabase
                .from('bbs_posts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (!error && data) setPosts(data);
            setLoading(false);
        };

        fetchPosts();

        const channel = supabase
            .channel('public:bbs_posts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bbs_posts' }, (payload: any) => {
                setPosts(prev => [payload.new as BBSPost, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !content.trim()) return;

        const display_name = user.user_metadata?.display_name || user.user_metadata?.full_name || user.email || 'Anonymous';
        const avatar_url = user.user_metadata?.avatar_url || '';

        setIsSubmitting(true);
        const { error } = await supabase.from('bbs_posts').insert([{
            user_id: user.id,
            display_name,
            avatar_url,
            content: content.trim()
        }]);

        if (!error) {
            setContent('');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="bbs-overlay panel-slide-in" onClick={onClose}>
            <div className="bbs-container" onClick={e => e.stopPropagation()}>
                <div className="bbs-header">
                    <h2>掲示板 (BBS)</h2>
                    <button className="bbs-close" onClick={onClose}>×</button>
                </div>

                <div className="bbs-feed">
                    {loading ? (
                        <div className="bbs-loading"><div className="loader">✦</div><p>読込中...</p></div>
                    ) : posts.length === 0 ? (
                        <p className="bbs-empty">まだ投稿がありません。最初の投稿をしてみましょう！</p>
                    ) : (
                        posts.map(post => (
                            <div key={post.id} className="bbs-post">
                                <div className="bbs-post-header">
                                    <div className="bbs-avatar">
                                        {post.avatar_url ? (
                                            <img src={post.avatar_url} alt={post.display_name} referrerPolicy="no-referrer" />
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="bbs-meta">
                                        <span className="bbs-author">{post.display_name || `User ${post.user_id.substring(0, 5)}`}</span>
                                        <span className="bbs-time">{new Date(post.created_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                                <div className="bbs-content">{post.content}</div>
                            </div>
                        ))
                    )}
                </div>

                <div className="bbs-input-area">
                    {user ? (
                        <form className="bbs-form" onSubmit={handlePost}>
                            <input
                                type="text"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="いまどうしてる？..."
                                maxLength={280}
                                disabled={isSubmitting}
                            />
                            <button type="submit" disabled={!content.trim() || isSubmitting}>
                                {isSubmitting ? '...' : '送信'}
                            </button>
                        </form>
                    ) : (
                        <div className="bbs-login-prompt">
                            <p>投稿するにはログインしてください</p>
                            <button className="bbs-login-btn" onClick={signInWithGoogle}>Googleでログイン</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

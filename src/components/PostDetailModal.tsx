import React, { useRef, useState } from 'react';
import { Comment, FeedPost, UserProfile } from '../lib/supabase';
import { store } from '../lib/store';
import { audio } from '../lib/audio';

interface PostDetailModalProps {
  post: FeedPost;
  currentUser: UserProfile | null;
  comments: Comment[];
  onClose: () => void;
  onReaction: (post: FeedPost, kind: 'like' | 'save') => void;
  onAddComment: (postId: string, body: string) => void;
  onDeleteComment?: (postId: string, commentId: number | string) => void;
  onShare: (post: FeedPost) => void;
  onToggleFollow: (userId: string) => void;
  onViewProfile?: (username: string) => void;
  onDeletePost?: (postId: string) => void;
  onViewLikes?: (post: FeedPost) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  currentUser,
  comments,
  onClose,
  onReaction,
  onAddComment,
  onDeleteComment,
  onShare,
  onToggleFollow,
  onViewProfile,
  onDeletePost,
  onViewLikes,
}) => {
  const [commentText, setCommentText] = useState('');
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const lastTapRef = useRef<number>(0);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const handleDoubleTap = () => {
    audio.playLikeSound();
    if (!post.liked) {
      onReaction(post, 'like');
    }
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 700);
  };

  const handleTouchEnd = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      handleDoubleTap();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText.trim());
    setCommentText('');
  };

  const username = post.profiles?.username || 'creator';
  const avatarUrl = post.profiles?.avatar_url;
  const isFollowing = store.isFollowing(post.user_id);
  const isOwner = currentUser?.id === post.user_id;

  return (
    <div className="app-dialog open" role="dialog" aria-modal="true">
      <div
        className="app-dialog-card post-detail-modal-card"
        style={{
          width: 'min(920px, 95vw)',
          maxHeight: 'min(720px, 90vh)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 1fr)',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 16,
        }}
      >
        {/* Left Column: Image */}
        <div
          className="post-detail-image-col"
          onDoubleClick={handleDoubleTap}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'relative',
            background: '#0a0d0c',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            minHeight: 400,
          }}
        >
          <img
            src={post.image_url}
            alt={post.caption || 'Post image'}
            style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: 'min(720px, 90vh)' }}
          />

          {showHeartBurst && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                pointerEvents: 'none',
                animation: 'likeAnimation 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
              }}
            >
              <i
                className="fa-solid fa-heart"
                style={{
                  fontSize: 90,
                  color: 'white',
                  filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.5))',
                }}
              />
            </div>
          )}
        </div>

        {/* Right Column: Details & Comments */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--surface)',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--line)',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: onViewProfile ? 'pointer' : 'default' }}
              onClick={() => {
                if (onViewProfile) {
                  onClose();
                  onViewProfile(username);
                }
              }}
              title={`View @${username}'s profile`}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={username}
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <span className="user-avatar profile-avatar-empty" style={{ width: 36, height: 36 }} />
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: 13 }}>{username}</div>
                {post.location && (
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{post.location}</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isOwner && onDeletePost && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete post"
                  title="Delete this moment"
                  style={{
                    color: '#bd4b3a',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(189, 75, 58, 0.3)',
                    background: 'rgba(189, 75, 58, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: 'pointer',
                  }}
                >
                  <i className="fa-regular fa-trash-can" />
                  <span>Delete</span>
                </button>
              )}
              {!isOwner && (
                <button
                  onClick={() => onToggleFollow(post.user_id)}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isFollowing ? 'var(--muted)' : 'var(--accent)',
                    padding: '4px 8px',
                  }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Close"
                style={{ color: 'var(--muted)', fontSize: 18, padding: 4 }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          </div>

          {/* Scrollable Comments & Caption Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {/* Post Caption as first item */}
            {post.caption && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, fontSize: 12 }}>
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt={username}
                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                  />
                )}
                <div>
                  <strong>{username}</strong>{' '}
                  <span>{post.caption}</span>
                </div>
              </div>
            )}

            {/* Comments List */}
            {comments.length > 0 ? (
              comments.map((item) => (
                <div
                  key={item.id}
                  style={{ display: 'flex', gap: 10, marginBottom: 14, fontSize: 12 }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'var(--mint)',
                      color: 'var(--ink)',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 700,
                      fontSize: 10,
                      flexShrink: 0,
                    }}
                  >
                    {item.profiles?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ marginRight: 6 }}>{item.profiles?.username || 'creator'}</strong>
                    <span>{item.body}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => {
                        const u = item.profiles?.username;
                        setCommentText(`@${u || 'creator'} `);
                        commentInputRef.current?.focus();
                      }}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'var(--muted)',
                        padding: '2px 4px',
                        cursor: 'pointer',
                      }}
                    >
                      Reply
                    </button>
                    {onDeleteComment && item.profiles?.username === currentUser?.username && (
                      <button
                        onClick={() => onDeleteComment(post.id, item.id)}
                        style={{
                          color: 'var(--muted)',
                          fontSize: 11,
                          padding: '2px 6px',
                          cursor: 'pointer',
                          opacity: 0.7,
                        }}
                        title="Delete your comment"
                      >
                        <i className="fa-regular fa-trash-can" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, padding: '30px 0' }}>
                No comments yet. Start the conversation!
              </div>
            )}
          </div>

          {/* Actions Bar */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--line)',
              background: 'var(--surface)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <button
                  className={`action-btn ${post.liked ? 'liked' : ''}`}
                  onClick={() => onReaction(post, 'like')}
                  aria-label={post.liked ? 'Unlike post' : 'Like post'}
                  style={{ fontSize: 20 }}
                >
                  <i
                    className={`${post.liked ? 'fa-solid' : 'fa-regular'} fa-heart`}
                    style={post.liked ? { color: 'var(--accent)' } : {}}
                  />
                </button>
                <button
                  className="action-btn"
                  onClick={() => onShare(post)}
                  aria-label="Share post"
                  style={{ fontSize: 20 }}
                >
                  <i className="fa-regular fa-paper-plane" />
                </button>
              </div>

              <button
                className={`action-btn ${post.saved ? 'saved' : ''}`}
                onClick={() => onReaction(post, 'save')}
                aria-label={post.saved ? 'Remove bookmark' : 'Save post'}
                style={{ fontSize: 20 }}
              >
                <i
                  className={`${post.saved ? 'fa-solid' : 'fa-regular'} fa-bookmark`}
                  style={post.saved ? { color: 'var(--ink)' } : {}}
                />
              </button>
            </div>

            <div
              onClick={() => onViewLikes && onViewLikes(post)}
              style={{
                fontSize: 12,
                fontWeight: 700,
                cursor: onViewLikes ? 'pointer' : 'default',
                display: 'inline-block',
              }}
              title={onViewLikes ? 'View who liked this moment' : undefined}
            >
              {post.likes.toLocaleString()} likes
            </div>
          </div>

          {/* Comment Form */}
          <form
            onSubmit={handleCommentSubmit}
            style={{
              display: 'flex',
              padding: '12px 20px',
              borderTop: '1px solid var(--line)',
              gap: 10,
            }}
          >
            <input
              ref={commentInputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              maxLength={180}
              style={{
                flex: 1,
                border: 0,
                outline: 0,
                fontSize: 12,
                background: 'transparent',
              }}
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              style={{
                fontWeight: 800,
                fontSize: 11,
                color: 'var(--accent)',
                opacity: commentText.trim() ? 1 : 0.4,
              }}
            >
              Post
            </button>
          </form>
        </div>
      </div>

      {/* Delete Post Confirmation Modal */}
      {confirmDelete && (
        <div className="app-dialog open" role="dialog" aria-modal="true" style={{ zIndex: 60 }}>
          <div className="app-dialog-card" style={{ maxWidth: 360, padding: 0 }}>
            <div style={{ padding: '24px 20px 16px', textAlign: 'center' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(189, 75, 58, 0.12)',
                  color: '#bd4b3a',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 22,
                  margin: '0 auto 14px',
                }}
              >
                <i className="fa-regular fa-trash-can" />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, letterSpacing: '-0.04em' }}>
                Delete moment?
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                Are you sure you want to delete this moment? This action cannot be undone.
              </p>
            </div>

            <div className="choice-list" style={{ padding: '8px 16px 16px' }}>
              <button
                className="choice-item danger"
                style={{ textAlign: 'center', fontWeight: 800, padding: '12px' }}
                onClick={() => {
                  if (onDeletePost) onDeletePost(post.id);
                  onClose();
                }}
              >
                Delete permanently
              </button>
              <button
                className="choice-item"
                style={{ textAlign: 'center', color: 'var(--muted)', padding: '10px' }}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

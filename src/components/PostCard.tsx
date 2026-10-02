import React, { useRef, useState } from 'react';
import { Comment, FeedPost } from '../lib/supabase';
import { audio } from '../lib/audio';

interface PostCardProps {
  post: FeedPost;
  comments: Comment[];
  onReaction: (post: FeedPost, kind: 'like' | 'save') => void;
  onAddComment: (postId: string, body: string) => void;
  onOptions: (post: FeedPost) => void;
  onShare: (post: FeedPost) => void;
  onOpenDetail?: (post: FeedPost) => void;
  onTagClick?: (tag: string) => void;
  onDeleteComment?: (postId: string, commentId: number | string) => void;
  onViewProfile?: (username: string) => void;
  onViewLikes?: (post: FeedPost) => void;
  currentUserUsername?: string;
}

const formatDate = (value: string) => {
  try {
    const d = new Date(value);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600));
    if (diffHours < 1) return 'JUST NOW';
    if (diffHours < 24) return `${diffHours} HOURS AGO`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} DAYS AGO`;
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(d).toUpperCase();
  } catch {
    return 'RECENTLY';
  }
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  comments,
  onReaction,
  onAddComment,
  onOptions,
  onShare,
  onOpenDetail,
  onTagClick,
  onDeleteComment,
  onViewProfile,
  onViewLikes,
  currentUserUsername,
}) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const lastTapRef = useRef<number>(0);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const handleDoubleTap = () => {
    audio.playLikeSound();
    if (!post.liked) {
      onReaction(post, 'like');
    }
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 800);
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
    setShowComments(true);
  };

  const renderCaption = (text: string) => {
    const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <span
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              if (onTagClick) onTagClick(part);
            }}
            style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
            title={`Filter by ${part}`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const username = post.profiles?.username || 'creator';
  const avatarUrl = post.profiles?.avatar_url;

  return (
    <article className="post-card" data-post-id={post.id}>
      {/* Post Header */}
      <div className="post-header">
        <div
          className="user-info"
          onClick={() => onViewProfile && onViewProfile(username)}
          style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
          title={`View @${username}'s profile`}
        >
          {avatarUrl ? (
            <img className="user-avatar" src={avatarUrl} alt={username} />
          ) : (
            <span className="user-avatar profile-avatar-empty" />
          )}
          <div className="user-details">
            <span className="username">{username}</span>
            <span className="location">{post.location || formatDate(post.created_at)}</span>
          </div>
        </div>
        <button
          className="post-options"
          onClick={() => onOptions(post)}
          aria-label="More options for this post"
        >
          <i className="fa-solid fa-ellipsis" />
        </button>
      </div>

      {/* Post Image with Double-Tap Heart */}
      <div
        className="post-image"
        onDoubleClick={handleDoubleTap}
        onTouchEnd={handleTouchEnd}
        style={{ position: 'relative', cursor: 'pointer' }}
      >
        <img
          src={post.image_url}
          alt={post.caption || 'Shared Mikesta post'}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80';
          }}
        />

        {/* View Details / Expand Overlay button */}
        {onOpenDetail && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(post);
            }}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(0,0,0,0.5)',
              color: 'white',
              borderRadius: '50%',
              width: 30,
              height: 30,
              display: 'grid',
              placeItems: 'center',
              fontSize: 12,
              opacity: 0.8,
              transition: 'opacity 0.2s',
            }}
            title="Inspect post details & comments"
          >
            <i className="fa-solid fa-up-right-and-down-left-from-center" />
          </button>
        )}

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
                fontSize: 84,
                color: 'white',
                filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.4))',
              }}
            />
          </div>
        )}
      </div>

      {/* Post Action Buttons */}
      <div className="post-actions">
        <div className="action-buttons">
          <button
            className={`action-btn like-btn ${post.liked ? 'liked' : ''}`}
            onClick={() => onReaction(post, 'like')}
            aria-label={post.liked ? 'Unlike post' : 'Like post'}
            aria-pressed={post.liked}
          >
            <i
              className={`${post.liked ? 'fa-solid' : 'fa-regular'} fa-heart`}
              style={post.liked ? { color: 'var(--accent)' } : {}}
            />
          </button>
          <button
            className="action-btn"
            onClick={() => setShowComments(!showComments)}
            aria-label="Comment on post"
          >
            <i className="fa-regular fa-comment" />
          </button>
          <button
            className="action-btn"
            onClick={() => onShare(post)}
            aria-label="Share post"
          >
            <i className="fa-regular fa-paper-plane" />
          </button>
        </div>
        <button
          className={`action-btn save-btn ${post.saved ? 'saved' : ''}`}
          onClick={() => onReaction(post, 'save')}
          aria-label={post.saved ? 'Remove bookmark' : 'Save post'}
          aria-pressed={post.saved}
        >
          <i
            className={`${post.saved ? 'fa-solid' : 'fa-regular'} fa-bookmark`}
            style={post.saved ? { color: 'var(--ink)' } : {}}
          />
        </button>
      </div>

      {/* Post Info & Engagement */}
      <div className="post-info">
        <div
          className="likes-count"
          onClick={() => onViewLikes && onViewLikes(post)}
          style={{ cursor: onViewLikes ? 'pointer' : 'default', display: 'inline-block' }}
          title={onViewLikes ? 'View who liked this moment' : undefined}
        >
          <strong>{post.likes.toLocaleString()} likes</strong>
        </div>

        {post.caption && (
          <div className="post-caption">
            <strong
              onClick={() => onViewProfile && onViewProfile(username)}
              style={{ cursor: onViewProfile ? 'pointer' : 'default', marginRight: 5 }}
            >
              {username}
            </strong>{' '}
            {!captionExpanded && post.caption.length > 95 ? (
              <>
                {renderCaption(post.caption.slice(0, 95))}
                <span
                  className="caption-more"
                  onClick={() => setCaptionExpanded(true)}
                  style={{ color: 'var(--muted)', cursor: 'pointer', marginLeft: 4, fontWeight: 700 }}
                >
                  ... more
                </span>
              </>
            ) : (
              renderCaption(post.caption)
            )}
          </div>
        )}

        {/* View / Toggle Comments */}
        {comments.length > 0 ? (
          <button
            className="view-comments"
            onClick={() => setShowComments(!showComments)}
          >
            {showComments
              ? `Hide comments (${comments.length})`
              : `View all ${comments.length} comments`}
          </button>
        ) : (
          <button
            className="view-comments"
            onClick={() => {
              setShowComments(true);
              setTimeout(() => commentInputRef.current?.focus(), 50);
            }}
          >
            {showComments ? 'Hide comments' : 'Add the first comment...'}
          </button>
        )}

        <div className="post-time">{formatDate(post.created_at)}</div>

        {/* Expandable Comments Panel */}
        {showComments && (
          <div className="comments-panel" style={{ marginTop: 12 }}>
            {comments.map((item) => (
              <div
                className="comment"
                key={item.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div>
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
                  {onDeleteComment && item.profiles?.username === currentUserUsername && (
                    <button
                      onClick={() => onDeleteComment(post.id, item.id)}
                      style={{
                        color: 'var(--muted)',
                        fontSize: 11,
                        padding: '2px 4px',
                        cursor: 'pointer',
                        opacity: 0.7,
                      }}
                      title="Delete comment"
                    >
                      <i className="fa-regular fa-trash-can" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <input
                ref={commentInputRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={180}
                placeholder="Add a comment..."
                aria-label="Add a comment"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                style={{ opacity: commentText.trim() ? 1 : 0.6 }}
              >
                Post
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
};

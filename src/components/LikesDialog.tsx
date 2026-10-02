import React from 'react';
import { FeedPost, UserProfile } from '../lib/supabase';
import { store } from '../lib/store';

interface LikesDialogProps {
  post: FeedPost;
  currentUser: UserProfile | null;
  onClose: () => void;
  onViewProfile?: (username: string) => void;
  onToggleFollow?: (userId: string) => void;
}

export const LikesDialog: React.FC<LikesDialogProps> = ({
  post,
  currentUser,
  onClose,
  onViewProfile,
  onToggleFollow,
}) => {
  const allSuggestions = store.getLikedProfiles(post.id).filter((profile) => profile.id !== currentUser?.id);

  // Create list of likers based on post.likes and liked state
  const likers: Array<{
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    isCurrent?: boolean;
    following: boolean;
  }> = [];

  if (post.liked && currentUser) {
    likers.push({
      id: currentUser.id,
      username: currentUser.username,
      display_name: currentUser.display_name,
      avatar_url: currentUser.avatar_url || '',
      isCurrent: true,
      following: false,
    });
  }

  // Add sample other likers from suggestions
  for (const s of allSuggestions) {
    if (likers.length < Math.min(8, post.likes)) {
      likers.push({
        id: s.id,
        username: s.username,
        display_name: s.display_name || s.username,
        avatar_url: s.avatar_url,
        isCurrent: false,
        following: store.isFollowing(s.id),
      });
    }
  }

  return (
    <div className="app-dialog open" role="dialog" aria-modal="true">
      <div className="app-dialog-card" style={{ maxWidth: 400, padding: 0 }}>
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
          <div style={{ fontWeight: 800, fontSize: 16 }}>Likes</div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ color: 'var(--muted)', fontSize: 18, padding: 4 }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Likers List */}
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '10px 16px' }}>
          {likers.length > 0 ? (
            likers.map((liker) => (
              <div
                key={liker.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 4px',
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                  onClick={() => {
                    onClose();
                    if (onViewProfile) onViewProfile(liker.username);
                  }}
                >
                  <img
                    src={
                      liker.avatar_url ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={liker.username}
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>
                      {liker.username} {liker.isCurrent && <span style={{ color: 'var(--muted)', fontWeight: 500 }}>(You)</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{liker.display_name}</div>
                  </div>
                </div>

                {!liker.isCurrent && onToggleFollow && (
                  <button
                    className={`follow-btn ${liker.following ? 'following' : ''}`}
                    onClick={() => onToggleFollow(liker.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      border: '1px solid var(--line)',
                      background: liker.following ? 'transparent' : 'var(--accent)',
                      color: liker.following ? 'var(--ink)' : 'white',
                    }}
                  >
                    {liker.following ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)', fontSize: 13 }}>
              <i className="fa-regular fa-heart" style={{ fontSize: 32, marginBottom: 10, display: 'block' }} />
              Be the first to like this moment!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

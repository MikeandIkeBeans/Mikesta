import React, { useState } from 'react';
import { FeedPost, UserProfile } from '../lib/supabase';
import { store } from '../lib/store';

interface ProfilePageProps {
  profile: UserProfile | null;
  posts: FeedPost[];
  savedPosts: FeedPost[];
  currentUser: UserProfile | null;
  navigate: (route: 'feed' | 'profile', username?: string) => void;
  onEdit: () => void;
  onSelectPost?: (post: FeedPost) => void;
  onToggleFollow?: (userId: string) => void;
  onDeletePost?: (postId: string) => void;
  onRemoveSaved?: (postId: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  posts,
  savedPosts,
  currentUser,
  navigate,
  onEdit,
  onSelectPost,
  onToggleFollow,
  onDeletePost,
  onRemoveSaved,
}) => {
  const [tab, setTab] = useState<'posts' | 'saved'>('posts');
  const [postToDelete, setPostToDelete] = useState<FeedPost | null>(null);
  const isOwnProfile = !profile || currentUser?.id === profile.id || currentUser?.username === profile.username;
  const isFollowing = profile ? store.isFollowing(profile.id) : false;

  const visible = isOwnProfile && tab === 'saved' ? savedPosts : posts;
  const username = profile?.username || 'your_profile';
  const displayName = profile?.display_name || username;

  return (
    <main className="profile-page">
      {/* Profile Hero */}
      <section className="profile-hero">
        <div className="profile-hero-inner">
          {profile?.avatar_url ? (
            <img
              className="profile-large-avatar"
              src={profile.avatar_url}
              alt={username}
            />
          ) : (
            <div className="profile-large-avatar profile-avatar-empty" />
          )}

          <div className="profile-headline">
            <div className="profile-title-row">
              <div>
                <p className="kicker">{isOwnProfile ? 'Your profile' : 'Creator circle'}</p>
                <h1>{displayName}</h1>
                <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>
                  @{username}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {isOwnProfile ? (
                  <button className="button-outline" onClick={onEdit}>
                    <i className="fa-solid fa-pen-to-square" style={{ marginRight: 6 }} />
                    Edit profile
                  </button>
                ) : (
                  <>
                    <button
                      className={isFollowing ? 'button-outline' : 'share-btn'}
                      onClick={() => onToggleFollow && onToggleFollow(profile!.id)}
                      style={{ padding: '8px 18px' }}
                    >
                      <i
                        className={`fa-solid ${isFollowing ? 'fa-user-check' : 'fa-user-plus'}`}
                        style={{ marginRight: 6 }}
                      />
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button
                      className="button-outline"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(window.location.href);
                        }
                      }}
                      title="Share profile link"
                    >
                      <i className="fa-regular fa-paper-plane" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <p className="profile-bio">
              {profile?.bio || 'Documenting light, design form, and quiet creative moments.'}
            </p>

            <div className="profile-stats">
              <span>
                <strong>{posts.length}</strong> posts
              </span>
              <span>
                <strong>{profile ? store.getFollowerCount(profile.id) : 0}</strong> followers
              </span>
              <span>
                <strong>{profile ? store.getFollowingCount(profile.id) : 0}</strong> following
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Tabs & Grid */}
      <section className="profile-content">
        <div className="profile-tabs">
          <button
            className={tab === 'posts' ? 'active' : ''}
            onClick={() => setTab('posts')}
          >
            <i className="fa-solid fa-table-cells" /> Posts ({posts.length})
          </button>
          {isOwnProfile && (
            <button
              className={tab === 'saved' ? 'active' : ''}
              onClick={() => setTab('saved')}
            >
              <i className="fa-regular fa-bookmark" /> Saved ({savedPosts.length})
            </button>
          )}
        </div>

        <div className="profile-grid">
          {visible.length > 0 ? (
            visible.map((post) => (
              <div
                key={post.id}
                style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden', borderRadius: 6 }}
                onClick={() => onSelectPost && onSelectPost(post)}
                title={post.caption || 'Photo'}
              >
                <img src={post.image_url} alt={post.caption || 'Mikesta post'} />

                {/* Quick actions for owner */}
                {isOwnProfile && tab === 'posts' && onDeletePost && (
                  <button
                    className="profile-post-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPostToDelete(post);
                    }}
                    aria-label="Delete post"
                    title="Delete moment"
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.65)',
                      color: 'white',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 13,
                      border: 0,
                      cursor: 'pointer',
                      zIndex: 2,
                      transition: 'all 0.2s',
                      backdropFilter: 'blur(4px)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = '#bd4b3a';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0, 0, 0, 0.65)';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    }}
                  >
                    <i className="fa-regular fa-trash-can" />
                  </button>
                )}

                {isOwnProfile && tab === 'saved' && onRemoveSaved && (
                  <button
                    className="profile-post-unsave-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSaved(post.id);
                    }}
                    aria-label="Remove from saved"
                    title="Remove from saved collection"
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.65)',
                      color: '#f1d879',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 13,
                      border: 0,
                      cursor: 'pointer',
                      zIndex: 2,
                      transition: 'all 0.2s',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <i className="fa-solid fa-bookmark" />
                  </button>
                )}

                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '8px 10px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 11,
                    opacity: 0.9,
                  }}
                >
                  <span>
                    <i className="fa-solid fa-heart" style={{ marginRight: 4 }} />
                    {post.likes}
                  </span>
                  <span>
                    <i className="fa-solid fa-comment" style={{ marginRight: 4 }} />
                    {post.comments}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div
              className="empty-state"
              style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px 20px' }}
            >
              <i
                className={tab === 'saved' ? 'fa-regular fa-bookmark' : 'fa-regular fa-image'}
                style={{ fontSize: 36, color: 'var(--muted)', marginBottom: 12 }}
              />
              <p style={{ fontWeight: 700, margin: '0 0 6px' }}>
                {tab === 'saved' ? 'No saved posts yet' : 'No posts shared yet'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
                {tab === 'saved'
                  ? 'Bookmark posts in your feed to curate your private collection.'
                  : `${username} hasn't shared any moments yet.`}
              </p>
            </div>
          )}
        </div>
      </section>

      <footer className="site-footer">
        <span>© 2026 MIKESTA · CREATOR ARCHIVE</span>
        <button onClick={() => navigate('feed')}>
          <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} />
          Back to feed
        </button>
      </footer>

      {/* Delete Post Confirmation Modal */}
      {postToDelete && (
        <div className="app-dialog open" role="dialog" aria-modal="true">
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
                Are you sure you want to delete this moment from your profile? This cannot be undone.
              </p>
            </div>

            <div className="choice-list" style={{ padding: '8px 16px 16px' }}>
              <button
                className="choice-item danger"
                style={{ textAlign: 'center', fontWeight: 800, padding: '12px' }}
                onClick={() => {
                  if (onDeletePost) onDeletePost(postToDelete.id);
                  setPostToDelete(null);
                }}
              >
                Delete permanently
              </button>
              <button
                className="choice-item"
                style={{ textAlign: 'center', color: 'var(--muted)', padding: '10px' }}
                onClick={() => setPostToDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

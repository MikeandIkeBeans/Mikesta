import React from 'react';
import { Comment, FeedPost, UserProfile } from '../lib/supabase';
import { FeedFilter } from '../lib/store';
import { Story, SuggestedUser } from '../lib/mockData';
import { PostCard } from './PostCard';

interface FeedPageProps {
  posts: FeedPost[];
  comments: Record<string, Comment[]>;
  stories: Story[];
  suggestions: SuggestedUser[];
  currentUser: UserProfile | null;
  activeFilter: FeedFilter;
  search: string;
  onFilterChange: (filter: FeedFilter) => void;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onAuth: () => void;
  onUpload: () => void;
  onShareStory: () => void;
  onViewStory: (story: Story) => void;
  onReaction: (post: FeedPost, kind: 'like' | 'save') => void;
  onAddComment: (postId: string, body: string) => void;
  onDeleteComment?: (postId: string, commentId: number | string) => void;
  onOptions: (post: FeedPost) => void;
  onShare: (post: FeedPost) => void;
  onOpenDetail?: (post: FeedPost) => void;
  onViewProfile?: (username: string) => void;
  onViewLikes?: (post: FeedPost) => void;
  onToggleFollow: (userId: string) => void;
  onResetSeed: () => void;
  navigate: (route: 'feed' | 'profile') => void;
}

const TOPIC_TAGS = [
  'All',
  '#minimalism',
  '#architecture',
  '#coffee',
  '#ceramics',
  '#scandinavia',
  '#light',
  '#wanderlust',
];

export const FeedPage: React.FC<FeedPageProps> = ({
  posts,
  comments,
  stories,
  suggestions,
  currentUser,
  activeFilter,
  search,
  onFilterChange,
  onSearchChange,
  onClearSearch,
  onUpload,
  onShareStory,
  onViewStory,
  onReaction,
  onAddComment,
  onDeleteComment,
  onOptions,
  onShare,
  onOpenDetail,
  onViewProfile,
  onViewLikes,
  onToggleFollow,
  onResetSeed,
  navigate,
}) => {
  return (
    <main className="main-container">
      <div className="feed-column">
        {/* Welcome Row with Filter Tabs */}
        <section className="welcome-row">
          <div>
            <p className="kicker">Your feed</p>
            <h1>
              Your circle, <em>in motion.</em>
            </h1>
          </div>

          <div
            style={{
              display: 'flex',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: 4,
              gap: 4,
            }}
          >
            <button
              onClick={() => onFilterChange('following')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                background: activeFilter === 'following' ? 'var(--ink)' : 'transparent',
                color: activeFilter === 'following' ? 'white' : 'var(--muted)',
                transition: 'all 0.2s',
              }}
            >
              Following
            </button>
            <button
              onClick={() => onFilterChange('foryou')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                background: activeFilter === 'foryou' ? 'var(--ink)' : 'transparent',
                color: activeFilter === 'foryou' ? 'white' : 'var(--muted)',
                transition: 'all 0.2s',
              }}
            >
              For you
            </button>
            <button
              onClick={() => onFilterChange('recent')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                background: activeFilter === 'recent' ? 'var(--ink)' : 'transparent',
                color: activeFilter === 'recent' ? 'white' : 'var(--muted)',
                transition: 'all 0.2s',
              }}
            >
              Recent
            </button>
          </div>
        </section>

        {/* Stories Rail */}
        <section className="stories-section" aria-label="Stories">
          <div className="stories-heading">
            <span>Stories</span>
            <button onClick={onShareStory}>
              Share a story <i className="fa-solid fa-arrow-right" />
            </button>
          </div>

          <div className="stories-container">
            {/* Create Story Circle */}
            <button
              className="story-item"
              onClick={onShareStory}
              style={{ cursor: 'pointer', textAlign: 'center' }}
              title="Add to your story"
            >
              <div className="story-ring" style={{ background: 'var(--line)' }}>
                <img
                  src={
                    currentUser?.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                  }
                  alt="Your story"
                />
                <b>+</b>
              </div>
              <span style={{ fontWeight: 600 }}>Your story</span>
            </button>

            {/* Friend Stories */}
            {stories.map((story) => (
              <button
                key={story.id}
                className="story-item"
                onClick={() => onViewStory(story)}
                style={{ cursor: 'pointer', textAlign: 'center' }}
                title={`View ${story.username}'s story`}
              >
                <div
                  className="story-ring"
                  style={
                    story.seen
                      ? { background: 'var(--line)' }
                      : { background: 'linear-gradient(140deg, #f1d879, #e76f51, #bd5a95)' }
                  }
                >
                  <img src={story.avatar_url} alt={story.username} />
                </div>
                <span>{story.username.slice(0, 10)}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Topic / Hashtag Exploration Pills */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
            marginBottom: 20,
            scrollbarWidth: 'none',
          }}
        >
          {TOPIC_TAGS.map((tag) => {
            const isTagActive = tag === 'All' ? !search.trim() : search.toLowerCase().includes(tag.toLowerCase().replace('#', ''));
            return (
              <button
                key={tag}
                onClick={() => {
                  if (tag === 'All') onClearSearch();
                  else onSearchChange(tag.replace('#', ''));
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  border: '1px solid var(--line)',
                  background: isTagActive ? 'var(--ink)' : 'var(--surface)',
                  color: isTagActive ? 'white' : 'var(--muted)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Search Notice Banner if filtered */}
        {search.trim() && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              marginBottom: 20,
              background: 'var(--mint)',
              borderRadius: 12,
              fontSize: 12,
            }}
          >
            <span>
              Searching for <strong>"{search}"</strong> ({posts.length} {posts.length === 1 ? 'post' : 'posts'} found)
            </span>
            <button
              onClick={onClearSearch}
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--accent)',
                textDecoration: 'underline',
              }}
            >
              Clear search
            </button>
          </div>
        )}

        {/* Posts Feed */}
        <section className="feed-section" id="explore">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                comments={comments[post.id] || []}
                onReaction={onReaction}
                onAddComment={onAddComment}
                onOptions={onOptions}
                onShare={onShare}
                onOpenDetail={onOpenDetail}
                onTagClick={(tag) => onSearchChange(tag.replace('#', ''))}
                onDeleteComment={onDeleteComment}
                onViewProfile={onViewProfile}
                onViewLikes={onViewLikes}
                currentUserUsername={currentUser?.username}
              />
            ))
          ) : (
            <div className="empty-state feed-empty" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <i
                className="fa-regular fa-image"
                style={{ fontSize: 42, color: 'var(--muted)', marginBottom: 16 }}
              />
              <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                {search.trim()
                  ? `No moments match "${search}"`
                  : activeFilter === 'following'
                  ? 'No posts from people you follow yet'
                  : 'Your feed is waiting for its first moment.'}
              </p>
              <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 20, maxWidth: 360, marginInline: 'auto' }}>
                {activeFilter === 'following'
                  ? 'Follow creators in the sidebar or switch to the "For you" feed to see what is trending.'
                  : 'Share your own photography or explore moments shared across the circle.'}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="share-btn" onClick={onUpload}>
                  Create a post
                </button>
                {activeFilter === 'following' ? (
                  <button className="button-outline" onClick={() => onFilterChange('foryou')}>
                    Explore "For you"
                  </button>
                ) : (
                  <button className="button-outline" onClick={onResetSeed}>
                    Load Seed Data
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Sidebar */}
      <aside className="sidebar">
        {/* Profile Summary */}
        <div className="profile-summary">
          {currentUser?.avatar_url ? (
            <img
              className="profile-avatar"
              src={currentUser.avatar_url}
              alt={currentUser.username}
              onClick={() => navigate('profile')}
              style={{ cursor: 'pointer' }}
            />
          ) : (
            <div
              className="profile-avatar profile-avatar-empty"
              onClick={() => navigate('profile')}
              style={{ cursor: 'pointer' }}
            />
          )}
          <div onClick={() => navigate('profile')} style={{ cursor: 'pointer' }}>
            <span className="profile-username">{currentUser?.username || 'Guest'}</span>
            <span className="profile-name">{currentUser?.display_name || 'Active Profile'}</span>
          </div>
          <button className="quiet-link" onClick={() => navigate('profile')}>
            View profile
          </button>
        </div>

        {/* People to Follow */}
        <div className="suggestions">
          <div className="suggestions-header">
            <span>People to follow</span>
            <span className="see-all">{suggestions.length} suggestions</span>
          </div>

          {suggestions.map((user) => (
            <div className="suggestion-item" key={user.id}>
              <img
                src={user.avatar_url}
                alt={user.username}
                onClick={() => onViewProfile && onViewProfile(user.username)}
                style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
                title={`View @${user.username}'s profile`}
              />
              <div
                className="suggestion-info"
                onClick={() => onViewProfile && onViewProfile(user.username)}
                style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
                title={`View @${user.username}'s profile`}
              >
                <span className="suggestion-username">{user.username}</span>
                <span className="suggestion-reason">{user.reason}</span>
              </div>
              <button
                className={`follow-btn ${user.following ? 'following' : ''}`}
                onClick={() => onToggleFollow(user.id)}
              >
                {user.following ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>

        {/* Quick Seeder & Interview Tool */}
        <div style={{ margin: '20px 0', padding: '14px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink)' }}>
              <i className="fa-solid fa-database" style={{ marginRight: 6, color: 'var(--accent)' }} />
              Database Status
            </span>
            <span style={{ fontSize: 9, fontFamily: 'monospace', background: 'var(--mint)', padding: '2px 6px', borderRadius: 4 }}>
              Active
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 10px' }}>
            Populated with curated photography, creators, and comments.
          </p>
          <button
            onClick={onResetSeed}
            style={{
              width: '100%',
              padding: '6px 10px',
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 6,
              border: '1px solid var(--line)',
              background: 'var(--paper)',
              color: 'var(--ink)',
            }}
          >
            <i className="fa-solid fa-arrows-rotate" style={{ marginRight: 5 }} />
            Reset to Seed Data
          </button>
        </div>

        <div className="sidebar-note">
          <span className="note-mark">“</span>
          <p>Photography is an immediate reaction, drawing is a meditation.</p>
        </div>

        <footer className="sidebar-footer">
          About · Help · Privacy · Terms · API<br />
          <span>© 2026 MIKESTA · INTERVIEW CHALLENGE</span>
        </footer>
      </aside>
    </main>
  );
};

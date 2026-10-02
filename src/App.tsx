import { useEffect, useState } from 'react';
import { FeedPost, UserProfile } from './lib/supabase';
import { FeedFilter, store } from './lib/store';
import { Story } from './lib/mockData';
import { Header } from './components/Header';
import { FeedPage } from './components/FeedPage';
import { ProfilePage } from './components/ProfilePage';
import { AuthDialog, AuthMode } from './components/AuthDialog';
import { UploadDialog } from './components/UploadDialog';
import { ShareStoryDialog } from './components/ShareStoryDialog';
import { StoryViewer } from './components/StoryViewer';
import { NotificationsDialog } from './components/NotificationsDialog';
import { PostOptionsDialog } from './components/PostOptionsDialog';
import { ShareDialog } from './components/ShareDialog';
import { EditProfileDialog } from './components/EditProfileDialog';
import { PostDetailModal } from './components/PostDetailModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { LikesDialog } from './components/LikesDialog';

type DialogType =
  | 'auth'
  | 'upload'
  | 'shareStory'
  | 'notifications'
  | 'options'
  | 'share'
  | 'editProfile'
  | 'shortcuts'
  | 'likes'
  | null;

const parseLocation = () => {
  const path = window.location.pathname;
  if (path.startsWith('/profile')) {
    const parts = path.split('/').filter(Boolean);
    if (parts.length > 1) {
      return { route: 'profile' as const, username: parts[1] };
    }
    return { route: 'profile' as const, username: null };
  }
  return { route: 'feed' as const, username: null };
};

export default function App() {
  const initial = parseLocation();
  const [route, setRoute] = useState<'feed' | 'profile'>(initial.route);
  const [viewingUsername, setViewingUsername] = useState<string | null>(initial.username);

  // Store state
  const [, setTick] = useState(0);
  const [dialog, setDialog] = useState<DialogType>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [notice, setNotice] = useState<{ message: string; tone: 'default' | 'error' } | null>(null);
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('following');
  const [search, setSearch] = useState('');

  // Selected entities for modals
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [detailPost, setDetailPost] = useState<FeedPost | null>(null);

  const announce = (message: string, tone: 'default' | 'error' = 'default') => {
    setNotice({ message, tone });
    window.setTimeout(() => setNotice(null), 3200);
  };

  const navigate = (nextRoute: 'feed' | 'profile', username?: string) => {
    let path = '/';
    if (nextRoute === 'profile') {
      if (username && username !== currentUser?.username) {
        path = `/profile/${username}`;
        setViewingUsername(username);
      } else {
        path = '/profile';
        setViewingUsername(null);
      }
    } else {
      setViewingUsername(null);
    }
    window.history.pushState({}, '', path);
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Re-render when store updates
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setTick((t) => t + 1);
    });

    const handlePopState = () => {
      const loc = parseLocation();
      setRoute(loc.route);
      setViewingUsername(loc.username);
    };
    window.addEventListener('popstate', handlePopState);

    // Global keyboard listener (Escape to close, ? for shortcuts)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);

      if (e.key === 'Escape') {
        if (detailPost) setDetailPost(null);
        else if (activeStory) setActiveStory(null);
        else setDialog(null);
      } else if (e.key === '?' && !isInput) {
        e.preventDefault();
        setDialog((curr) => (curr === 'shortcuts' ? null : 'shortcuts'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribe();
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [detailPost, activeStory]);

  useEffect(() => {
    store.syncWithSupabase();
  }, []);

  // Lock body scroll when any dialog or modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(dialog || activeStory || detailPost);
    if (isAnyModalOpen) {
      document.body.classList.add('dialog-open');
    } else {
      document.body.classList.remove('dialog-open');
    }
    return () => {
      document.body.classList.remove('dialog-open');
    };
  }, [dialog, activeStory, detailPost]);

  const currentUser = store.getCurrentUser();
  const filteredPosts = store.getFilteredPosts(activeFilter, search);
  const savedPosts = store.getSavedPosts();
  const stories = store.getStories();
  const notifications = store.getNotifications();
  const suggestions = store.getSuggestions();
  const unreadCount = store.getUnreadNotificationCount();
  const isOnline = store.getIsOnline();

  // Target profile for ProfilePage
  const targetProfile = viewingUsername
    ? store.getProfileByUsername(viewingUsername)
    : currentUser;
  const targetPosts = viewingUsername
    ? store.getPostsByUsername(viewingUsername)
    : store.getUserPosts();

  // Keep detailPost updated if posts state changes (e.g. likes/comments)
  const currentDetailPost = detailPost
    ? store.getPosts().find((p) => p.id === detailPost.id) || detailPost
    : null;

  // Handlers
  const handleReaction = (post: FeedPost, kind: 'like' | 'save') => {
    if (kind === 'like') {
      const liked = store.toggleLike(post.id);
      if (liked) {
        announce('Moment liked');
      }
    } else {
      const saved = store.toggleSave(post.id);
      announce(saved ? 'Moment added to your saved collection' : 'Moment removed from saved');
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    try {
      await store.addComment(postId, text);
      announce('Comment posted');
    } catch (err: any) {
      announce(err.message, 'error');
    }
  };

  const handleDeleteComment = (postId: string, commentId: number | string) => {
    store.deleteComment(postId, commentId);
    announce('Comment removed');
  };

  const handlePublishPost = async (params: {
    file?: File | null;
    imageUrl?: string;
    caption: string;
    location?: string;
  }) => {
    await store.createPost(params);
    announce('Your moment is live in the circle!');
    setDialog(null);
  };

  const handleAddStory = (params: { imageUrl: string; caption?: string }) => {
    store.addStory(params);
    announce('Story published to your circle');
    setDialog(null);
  };

  const handleCopyLink = (postId?: string) => {
    const id = postId || selectedPost?.id;
    const url = `${window.location.origin}/#post-${id || 'featured'}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      announce('Post link copied to clipboard');
    } else {
      announce('Link ready: ' + url);
    }
  };

  const handleDeletePost = (postId: string) => {
    store.deletePost(postId);
    if (detailPost?.id === postId) {
      setDetailPost(null);
    }
    announce('Post deleted');
    setDialog(null);
  };

  const handleToggleFollow = (userId: string) => {
    const isNowFollowing = store.toggleFollow(userId);
    announce(isNowFollowing ? 'Added to your following circle' : 'Unfollowed creator');
  };

  const handleViewLikes = (post: FeedPost) => {
    setSelectedPost(post);
    setDialog('likes');
  };

  const handleSaveProfile = async (updates: Partial<UserProfile>, avatarFile?: File | null) => {
    await store.updateProfile(updates, avatarFile);
    announce('Profile updated successfully');
  };

  const handleViewStory = (story: Story) => {
    store.markStorySeen(story.id);
    setActiveStory(story);
  };

  const handleNextStory = () => {
    if (!activeStory) return;
    const currentIndex = stories.findIndex((s) => s.id === activeStory.id);
    if (currentIndex >= 0 && currentIndex < stories.length - 1) {
      const next = stories[currentIndex + 1];
      store.markStorySeen(next.id);
      setActiveStory(next);
    } else {
      setActiveStory(null);
    }
  };

  const handlePrevStory = () => {
    if (!activeStory) return;
    const currentIndex = stories.findIndex((s) => s.id === activeStory.id);
    if (currentIndex > 0) {
      setActiveStory(stories[currentIndex - 1]);
    }
  };

  const commentsMap: Record<string, any[]> = {};
  for (const post of filteredPosts) {
    commentsMap[post.id] = store.getComments(post.id);
  }

  return (
    <>
      {/* Offline Status Notice */}
      {!isOnline && (
        <div
          style={{
            background: 'var(--ink)',
            color: 'var(--yellow)',
            textAlign: 'center',
            padding: '7px 14px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
        >
          <i className="fa-solid fa-wifi" style={{ marginRight: 8, opacity: 0.7 }} />
          Offline mode active — moments and comments are saved locally and will synchronize when connection restores.
        </div>
      )}

      <Header
        currentUser={currentUser}
        route={route}
        navigate={navigate}
        onUpload={() => setDialog('upload')}
        onNotifications={() => setDialog('notifications')}
        onAuth={() => setDialog('auth')}
        unreadCount={unreadCount}
        search={search}
        onSearchChange={setSearch}
      />

      {route === 'profile' ? (
        <ProfilePage
          profile={targetProfile}
          posts={targetPosts}
          savedPosts={savedPosts}
          currentUser={currentUser}
          navigate={navigate}
          onEdit={() => setDialog('editProfile')}
          onSelectPost={(post) => setDetailPost(post)}
          onToggleFollow={handleToggleFollow}
          onDeletePost={handleDeletePost}
          onRemoveSaved={(postId) => {
            store.toggleSave(postId);
            announce('Moment removed from saved');
          }}
        />
      ) : (
        <FeedPage
          posts={filteredPosts}
          comments={commentsMap}
          stories={stories}
          suggestions={suggestions}
          currentUser={currentUser}
          activeFilter={activeFilter}
          search={search}
          onFilterChange={setActiveFilter}
          onSearchChange={setSearch}
          onClearSearch={() => setSearch('')}
          onAuth={() => setDialog('auth')}
          onUpload={() => setDialog('upload')}
          onShareStory={() => setDialog('shareStory')}
          onViewStory={handleViewStory}
          onReaction={handleReaction}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          onOptions={(post) => {
            setSelectedPost(post);
            setDialog('options');
          }}
          onShare={(post) => {
            setSelectedPost(post);
            setDialog('share');
          }}
          onOpenDetail={(post) => setDetailPost(post)}
          onViewProfile={(uname) => navigate('profile', uname)}
          onViewLikes={handleViewLikes}
          onToggleFollow={handleToggleFollow}
          onResetSeed={() => {
            store.resetToSeedData();
            announce('Seed fixtures reloaded');
          }}
          navigate={navigate}
        />
      )}

      {/* Post Detail / Lightbox Modal */}
      {currentDetailPost && (
        <PostDetailModal
          post={currentDetailPost}
          currentUser={currentUser}
          comments={store.getComments(currentDetailPost.id)}
          onClose={() => setDetailPost(null)}
          onReaction={handleReaction}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          onShare={(post) => {
            setSelectedPost(post);
            setDialog('share');
          }}
          onToggleFollow={handleToggleFollow}
          onViewProfile={(uname) => {
            setDetailPost(null);
            navigate('profile', uname);
          }}
          onDeletePost={handleDeletePost}
          onViewLikes={handleViewLikes}
        />
      )}

      {/* Active Story Viewer Modal */}
      {activeStory && (
        <StoryViewer
          story={activeStory}
          onClose={() => setActiveStory(null)}
          onNext={handleNextStory}
          onPrev={handlePrevStory}
        />
      )}

      {/* Upload Post Dialog */}
      {dialog === 'upload' && (
        <UploadDialog
          onPublish={handlePublishPost}
          onClose={() => setDialog(null)}
        />
      )}

      {/* Share Story Dialog */}
      {dialog === 'shareStory' && (
        <ShareStoryDialog
          onAddStory={handleAddStory}
          onClose={() => setDialog(null)}
        />
      )}

      {/* Notifications Dialog */}
      {dialog === 'notifications' && (
        <NotificationsDialog
          notifications={notifications}
          onClose={() => setDialog(null)}
          onMarkAllRead={() => {
            store.markAllNotificationsRead();
            announce('All notifications marked as read');
          }}
        />
      )}

      {/* Post Options Dialog */}
      {dialog === 'options' && selectedPost && (
        <PostOptionsDialog
          post={selectedPost}
          currentUser={currentUser}
          isFollowingAuthor={store.isFollowing(selectedPost.user_id)}
          onClose={() => setDialog(null)}
          onCopyLink={() => handleCopyLink(selectedPost.id)}
          onShare={() => setDialog('share')}
          onToggleFollow={() => handleToggleFollow(selectedPost.user_id)}
          onDeletePost={() => handleDeletePost(selectedPost.id)}
        />
      )}

      {/* Share Dialog */}
      {dialog === 'share' && selectedPost && (
        <ShareDialog
          post={selectedPost}
          onClose={() => setDialog(null)}
          onCopyLink={() => handleCopyLink(selectedPost.id)}
        />
      )}

      {/* Edit Profile Dialog */}
      {dialog === 'editProfile' && (
        <EditProfileDialog
          profile={currentUser}
          onSave={handleSaveProfile}
          onClose={() => setDialog(null)}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {dialog === 'shortcuts' && (
        <ShortcutsModal onClose={() => setDialog(null)} />
      )}

      {/* Auth Dialog */}
      {dialog === 'auth' && (
        <AuthDialog
          mode={authMode}
          setMode={setAuthMode}
          onSuccess={() => setDialog(null)}
          onClose={() => setDialog(null)}
          onAnnounce={announce}
        />
      )}

      {/* Likes Dialog */}
      {dialog === 'likes' && selectedPost && (
        <LikesDialog
          post={selectedPost}
          currentUser={currentUser}
          onClose={() => setDialog(null)}
          onViewProfile={(uname) => {
            setDialog(null);
            if (detailPost) setDetailPost(null);
            navigate('profile', uname);
          }}
          onToggleFollow={handleToggleFollow}
        />
      )}

      {/* Toast Notification */}
      {notice && (
        <div id="toast" className="visible" data-tone={notice.tone} role="status">
          {notice.message}
        </div>
      )}
    </>
  );
}

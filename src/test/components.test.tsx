import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PostCard } from '../components/PostCard';
import { Header } from '../components/Header';
import { ProfilePage } from '../components/ProfilePage';
import { PostDetailModal } from '../components/PostDetailModal';
import { LikesDialog } from '../components/LikesDialog';
import { StoryViewer } from '../components/StoryViewer';
import { FeedPost } from '../lib/supabase';
import { CURRENT_DEMO_USER } from '../lib/mockData';

const mockPost: FeedPost = {
  id: 'test-post-1',
  user_id: 'a1111111-1111-1111-1111-111111111111',
  image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f',
  caption: 'Morning light study',
  location: 'San Francisco, CA',
  created_at: new Date().toISOString(),
  profiles: {
    username: 'elena_lens',
    display_name: 'Elena Rodriguez',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
  },
  likes: 42,
  comments: 1,
  liked: false,
  saved: false,
};

const mockComments = [
  {
    id: 1,
    body: 'Great tonality!',
    created_at: new Date().toISOString(),
    profiles: { username: 'marcus_creates' },
  },
];

describe('PostCard Component', () => {
  it('renders post details, author, location, and like count', () => {
    const handleReaction = vi.fn();
    const handleAddComment = vi.fn();
    const handleOptions = vi.fn();
    const handleShare = vi.fn();

    render(
      <PostCard
        post={mockPost}
        comments={mockComments}
        onReaction={handleReaction}
        onAddComment={handleAddComment}
        onOptions={handleOptions}
        onShare={handleShare}
      />
    );

    expect(screen.getAllByText('elena_lens').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    expect(screen.getByText('42 likes')).toBeInTheDocument();
    expect(screen.getByText(/Morning light study/)).toBeInTheDocument();
  });

  it('triggers like reaction callback when like button is clicked', () => {
    const handleReaction = vi.fn();

    render(
      <PostCard
        post={mockPost}
        comments={mockComments}
        onReaction={handleReaction}
        onAddComment={vi.fn()}
        onOptions={vi.fn()}
        onShare={vi.fn()}
      />
    );

    const likeButton = screen.getByLabelText('Like post');
    fireEvent.click(likeButton);
    expect(handleReaction).toHaveBeenCalledWith(mockPost, 'like');
  });

  it('toggles comments panel when view comments is clicked and submits new comment', () => {
    const handleAddComment = vi.fn();

    render(
      <PostCard
        post={mockPost}
        comments={mockComments}
        onReaction={vi.fn()}
        onAddComment={handleAddComment}
        onOptions={vi.fn()}
        onShare={vi.fn()}
      />
    );

    // Expand comments
    const viewCommentsBtn = screen.getByText('View all 1 comments');
    fireEvent.click(viewCommentsBtn);

    expect(screen.getByText('Great tonality!')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(input, { target: { value: 'Incredible shot!' } });

    const postBtn = screen.getByText('Post');
    fireEvent.click(postBtn);

    expect(handleAddComment).toHaveBeenCalledWith('test-post-1', 'Incredible shot!');
  });
});

describe('Header Component', () => {
  it('renders logo, search bar, and handles search input', () => {
    const handleSearchChange = vi.fn();
    const handleNavigate = vi.fn();

    render(
      <Header
        currentUser={CURRENT_DEMO_USER}
        route="feed"
        navigate={handleNavigate}
        onUpload={vi.fn()}
        onNotifications={vi.fn()}
        onAuth={vi.fn()}
        unreadCount={3}
        search="coffee"
        onSearchChange={handleSearchChange}
      />
    );

    expect(screen.getByText('Mikesta')).toBeInTheDocument();
    const searchInput = screen.getByPlaceholderText('Search moments, people, places');
    expect(searchInput).toHaveValue('coffee');

    fireEvent.change(searchInput, { target: { value: 'ceramics' } });
    expect(handleSearchChange).toHaveBeenCalledWith('ceramics');
  });
});

describe('ProfilePage Component', () => {
  const otherUser = {
    id: 'b2222222-2222-2222-2222-222222222222',
    username: 'marcus_creates',
    display_name: 'Marcus Vance',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    bio: 'Architectural photographer based in Tokyo.',
  };

  it('renders other creator profile with Follow button and creator circle label', () => {
    const handleToggleFollow = vi.fn();
    const handleSelectPost = vi.fn();

    render(
      <ProfilePage
        profile={otherUser}
        posts={[mockPost]}
        savedPosts={[]}
        currentUser={CURRENT_DEMO_USER}
        navigate={vi.fn()}
        onEdit={vi.fn()}
        onSelectPost={handleSelectPost}
        onToggleFollow={handleToggleFollow}
      />
    );

    expect(screen.getByText('Creator circle')).toBeInTheDocument();
    expect(screen.getByText('Marcus Vance')).toBeInTheDocument();
    expect(screen.getByText('@marcus_creates')).toBeInTheDocument();
    expect(screen.getByText('Architectural photographer based in Tokyo.')).toBeInTheDocument();

    const followBtn = screen.getByRole('button', { name: /Follow/i });
    expect(followBtn).toBeInTheDocument();
    fireEvent.click(followBtn);
    expect(handleToggleFollow).toHaveBeenCalledWith(otherUser.id);

    // Saved tab should NOT be rendered on other creator profiles
    expect(screen.queryByText(/Saved/)).not.toBeInTheDocument();
  });

  it('renders own profile with Edit Profile button and Saved tab', () => {
    const handleEdit = vi.fn();

    render(
      <ProfilePage
        profile={CURRENT_DEMO_USER}
        posts={[mockPost]}
        savedPosts={[mockPost]}
        currentUser={CURRENT_DEMO_USER}
        navigate={vi.fn()}
        onEdit={handleEdit}
      />
    );

    expect(screen.getByText('Your profile')).toBeInTheDocument();
    expect(screen.getByText('Edit profile')).toBeInTheDocument();
    expect(screen.getByText(/Saved \(1\)/)).toBeInTheDocument();

    const editBtn = screen.getByText('Edit profile');
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalled();
  });

  it('allows owner to delete post with confirmation from profile', () => {
    const handleDeletePost = vi.fn();

    render(
      <ProfilePage
        profile={CURRENT_DEMO_USER}
        posts={[mockPost]}
        savedPosts={[]}
        currentUser={CURRENT_DEMO_USER}
        navigate={vi.fn()}
        onEdit={vi.fn()}
        onDeletePost={handleDeletePost}
      />
    );

    // Find delete button on post thumbnail
    const deleteBtn = screen.getByLabelText('Delete post');
    expect(deleteBtn).toBeInTheDocument();
    fireEvent.click(deleteBtn);

    // Confirmation modal should appear
    expect(screen.getByText('Delete moment?')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete this moment/)).toBeInTheDocument();

    // Confirm deletion
    const confirmBtn = screen.getByText('Delete permanently');
    fireEvent.click(confirmBtn);

    expect(handleDeletePost).toHaveBeenCalledWith(mockPost.id);
  });

  it('cancels deletion when cancel is clicked in modal', () => {
    const handleDeletePost = vi.fn();

    render(
      <ProfilePage
        profile={CURRENT_DEMO_USER}
        posts={[mockPost]}
        savedPosts={[]}
        currentUser={CURRENT_DEMO_USER}
        navigate={vi.fn()}
        onEdit={vi.fn()}
        onDeletePost={handleDeletePost}
      />
    );

    const deleteBtn = screen.getByLabelText('Delete post');
    fireEvent.click(deleteBtn);

    expect(screen.getByText('Delete moment?')).toBeInTheDocument();

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('Delete moment?')).not.toBeInTheDocument();
    expect(handleDeletePost).not.toHaveBeenCalled();
  });
});

describe('PostDetailModal Component Deletion', () => {
  it('allows author to delete post from detail modal with confirmation', () => {
    const handleDeletePost = vi.fn();
    const handleClose = vi.fn();

    const ownerPost = {
      ...mockPost,
      user_id: CURRENT_DEMO_USER.id,
    };

    render(
      <PostDetailModal
        post={ownerPost}
        currentUser={CURRENT_DEMO_USER}
        comments={[]}
        onClose={handleClose}
        onReaction={vi.fn()}
        onAddComment={vi.fn()}
        onShare={vi.fn()}
        onToggleFollow={vi.fn()}
        onDeletePost={handleDeletePost}
      />
    );

    const deleteHeaderBtn = screen.getByRole('button', { name: /Delete post/i });
    expect(deleteHeaderBtn).toBeInTheDocument();
    fireEvent.click(deleteHeaderBtn);

    expect(screen.getByText('Delete moment?')).toBeInTheDocument();

    const confirmBtn = screen.getByText('Delete permanently');
    fireEvent.click(confirmBtn);

    expect(handleDeletePost).toHaveBeenCalledWith(ownerPost.id);
    expect(handleClose).toHaveBeenCalled();
  });
});

describe('LikesDialog Component', () => {
  it('renders list of likers and triggers profile navigation', () => {
    const handleViewProfile = vi.fn();
    const likedPost = {
      ...mockPost,
      liked: true,
      likes: 12,
    };

    render(
      <LikesDialog
        post={likedPost}
        currentUser={CURRENT_DEMO_USER}
        onClose={vi.fn()}
        onViewProfile={handleViewProfile}
        onToggleFollow={vi.fn()}
      />
    );

    expect(screen.getByText('Likes')).toBeInTheDocument();
    // Current user should be listed when post is liked
    expect(screen.getAllByText(new RegExp(CURRENT_DEMO_USER.username)).length).toBeGreaterThanOrEqual(1);

    const userEntry = screen.getByText(CURRENT_DEMO_USER.username);
    fireEvent.click(userEntry);
    expect(handleViewProfile).toHaveBeenCalledWith(CURRENT_DEMO_USER.username);
  });
});

describe('StoryViewer Component', () => {
  const mockStory = {
    id: 'story-1',
    user_id: 'u1',
    username: 'maya_visuals',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
    story_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
    caption: 'Studio light reflections',
    created_at: '2h ago',
    seen: false,
  };

  it('renders story details, input reply and sends reply notice', () => {
    render(
      <StoryViewer
        story={mockStory}
        onClose={vi.fn()}
        onNext={vi.fn()}
        onPrev={vi.fn()}
      />
    );

    expect(screen.getByText('maya_visuals')).toBeInTheDocument();
    expect(screen.getByText('Studio light reflections')).toBeInTheDocument();

    const replyInput = screen.getByPlaceholderText('Reply to maya_visuals...');
    fireEvent.change(replyInput, { target: { value: 'Stunning colors!' } });

    const sendBtn = screen.getByText('Send');
    fireEvent.click(sendBtn);

    expect(screen.getByText('Reply sent to @maya_visuals')).toBeInTheDocument();
  });
});

describe('PostCard Caption Truncation', () => {
  it('truncates long captions and expands when more is clicked', () => {
    const longPost = {
      ...mockPost,
      caption: 'This is an exceptionally long caption crafted specifically to test Instagram-style caption truncation in the feed view component so it does not clutter users screens.',
    };

    render(
      <PostCard
        post={longPost}
        comments={[]}
        onReaction={vi.fn()}
        onAddComment={vi.fn()}
        onOptions={vi.fn()}
        onShare={vi.fn()}
      />
    );

    const moreBtn = screen.getByText('... more');
    expect(moreBtn).toBeInTheDocument();

    fireEvent.click(moreBtn);

    expect(screen.queryByText('... more')).not.toBeInTheDocument();
    expect(screen.getByText(/crafted specifically to test/)).toBeInTheDocument();
  });
});


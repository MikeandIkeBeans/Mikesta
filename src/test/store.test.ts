import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../lib/store';

describe('MikestaStore', () => {
  beforeEach(() => {
    localStorage.clear();
    store.resetToSeedData();
  });

  it('initializes with seed posts, stories, suggestions, and current user', () => {
    const posts = store.getPosts();
    expect(posts.length).toBeGreaterThanOrEqual(6);
    expect(store.getCurrentUser()?.username).toBe('elena_lens');
    expect(store.getStories().length).toBeGreaterThanOrEqual(4);
    expect(store.getSuggestions().length).toBeGreaterThanOrEqual(4);
  });

  it('toggles like on a post and updates like count', () => {
    const posts = store.getPosts();
    const targetPost = posts[0];
    const initialLikes = targetPost.likes;
    const initialLiked = targetPost.liked;

    const newLiked = store.toggleLike(targetPost.id);
    expect(newLiked).toBe(!initialLiked);

    const updatedPost = store.getPosts().find((p) => p.id === targetPost.id);
    expect(updatedPost?.liked).toBe(!initialLiked);
    expect(updatedPost?.likes).toBe(initialLiked ? initialLikes - 1 : initialLikes + 1);

    // Toggle back
    store.toggleLike(targetPost.id);
    const revertedPost = store.getPosts().find((p) => p.id === targetPost.id);
    expect(revertedPost?.liked).toBe(initialLiked);
    expect(revertedPost?.likes).toBe(initialLikes);
  });

  it('toggles bookmark / save and updates saved posts list', () => {
    const posts = store.getPosts();
    const targetPost = posts[1]; // Initially not saved

    store.toggleSave(targetPost.id);
    expect(store.getSavedPosts().some((p) => p.id === targetPost.id)).toBe(true);

    store.toggleSave(targetPost.id);
    expect(store.getSavedPosts().some((p) => p.id === targetPost.id)).toBe(false);
  });

  it('adds a new comment and updates comment count on the post', async () => {
    const posts = store.getPosts();
    const targetPost = posts[0];
    const initialCommentCount = targetPost.comments;

    const comment = await store.addComment(targetPost.id, 'Stunning architectural framing!');
    expect(comment.body).toBe('Stunning architectural framing!');
    expect(comment.profiles?.username).toBe('elena_lens');

    const updatedComments = store.getComments(targetPost.id);
    expect(updatedComments.some((c) => c.body === 'Stunning architectural framing!')).toBe(true);

    const updatedPost = store.getPosts().find((p) => p.id === targetPost.id);
    expect(updatedPost?.comments).toBe(initialCommentCount + 1);
  });

  it('restores fresh seed fixtures after local mutations', async () => {
    const targetPost = store.getPosts()[0];
    const initialCommentCount = store.getComments(targetPost.id).length;

    await store.addComment(targetPost.id, 'Temporary local comment');
    expect(store.getComments(targetPost.id)).toHaveLength(initialCommentCount + 1);

    store.resetToSeedData();

    expect(store.getComments(targetPost.id)).toHaveLength(initialCommentCount);
    expect(store.getPosts().find((post) => post.id === targetPost.id)?.comments).toBe(
      targetPost.comments
    );
  });

  it('rejects invalid comment lengths before changing local state', async () => {
    const targetPost = store.getPosts()[0];
    const initialCommentCount = store.getComments(targetPost.id).length;
    const initialPostCount = targetPost.comments;

    await expect(store.addComment(targetPost.id, '   ')).rejects.toThrow('Comment cannot be empty');
    await expect(store.addComment(targetPost.id, 'x'.repeat(181))).rejects.toThrow(
      'Comment must be 180 characters or fewer'
    );

    expect(store.getComments(targetPost.id)).toHaveLength(initialCommentCount);
    expect(store.getPosts().find((post) => post.id === targetPost.id)?.comments).toBe(initialPostCount);
  });

  it('filters posts by search query across captions and usernames', () => {
    const kyotoResults = store.getFilteredPosts('foryou', 'kyoto');
    expect(kyotoResults.length).toBeGreaterThanOrEqual(1);
    expect(kyotoResults[0].location).toContain('Kyoto');

    const hashtagResults = store.getFilteredPosts('recent', 'minimalism');
    expect(hashtagResults.length).toBeGreaterThanOrEqual(1);

    const emptyResults = store.getFilteredPosts('recent', 'xyznonexistent123');
    expect(emptyResults.length).toBe(0);
  });

  it('filters posts by following vs recent vs foryou', () => {
    const followingPosts = store.getFilteredPosts('following');
    expect(followingPosts.length).toBeGreaterThan(0);

    const forYouPosts = store.getFilteredPosts('foryou');
    expect(forYouPosts.length).toBe(store.getPosts().length);
    // Highest engagement should be first in foryou
    expect(forYouPosts[0].likes + forYouPosts[0].comments * 3).toBeGreaterThanOrEqual(
      forYouPosts[forYouPosts.length - 1].likes + forYouPosts[forYouPosts.length - 1].comments * 3
    );
  });

  it('toggles follow status and reflects in following list', () => {
    const suggestions = store.getSuggestions();
    const target = suggestions.find((s) => !s.following)!;

    const isFollowing = store.toggleFollow(target.id);
    expect(isFollowing).toBe(true);
    expect(store.isFollowing(target.id)).toBe(true);

    // Toggle back
    store.toggleFollow(target.id);
    expect(store.isFollowing(target.id)).toBe(false);
  });

  it('keeps likes, saves, and follows isolated when switching users', () => {
    const likedPost = store.getPosts()[1];
    const savedPost = store.getPosts()[0];
    const followedUser = store.getSuggestions().find((suggestion) => !suggestion.following)!;

    expect(likedPost.liked).toBe(true);
    store.toggleSave(savedPost.id);
    store.toggleFollow(followedUser.id);

    store.switchUser(store.getAvailableProfiles()[1]);

    expect(store.getPosts().find((post) => post.id === likedPost.id)?.liked).toBe(false);
    expect(store.getSavedPosts().some((post) => post.id === savedPost.id)).toBe(false);
    expect(store.isFollowing(followedUser.id)).toBe(false);

    store.toggleLike(likedPost.id);
    store.toggleSave(savedPost.id);
    store.toggleFollow(followedUser.id);
    store.switchUser(store.getAvailableProfiles()[0]);

    expect(store.getPosts().find((post) => post.id === likedPost.id)?.liked).toBe(true);
    expect(store.getSavedPosts().some((post) => post.id === savedPost.id)).toBe(true);
    expect(store.isFollowing(followedUser.id)).toBe(true);
  });

  it('updates profile and updates author info across authored posts', async () => {
    await store.updateProfile({
      display_name: 'Elena R. Photography',
      bio: 'New bio description test.',
    });

    expect(store.getCurrentUser()?.display_name).toBe('Elena R. Photography');
    expect(store.getCurrentUser()?.bio).toBe('New bio description test.');

    const authoredPosts = store.getUserPosts();
    expect(authoredPosts[0].profiles?.display_name).toBe('Elena R. Photography');
  });

  it('creates and deletes a post', async () => {
    const initialCount = store.getPosts().length;

    const newPost = await store.createPost({
      imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f',
      caption: 'Brand new test moment #test',
      location: 'Studio, SF',
    });

    expect(store.getPosts().length).toBe(initialCount + 1);
    expect(store.getPosts()[0].id).toBe(newPost.id);

    store.deletePost(newPost.id);
    expect(store.getPosts().length).toBe(initialCount);
    expect(store.getPosts().some((p) => p.id === newPost.id)).toBe(false);
  });
});

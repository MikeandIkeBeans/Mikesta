/**
 * Mikesta — Client Application Core
 * Features: State persistence, themes, stories viewer, audio synth,
 * double-tap heart burst, photo filters, live search, inline comments, lightbox.
 */

// Helper selectors
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const on = (element, event, handler, options) => element?.addEventListener(event, handler, options);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const STORAGE_KEY = 'mikesta-state-v3';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

// Default initial state
const defaultState = {
  likedPosts: ['post-1'],
  savedPosts: ['post-2'],
  followedUsers: ['ava.studio'],
  posts: [],
  postStats: {
    'post-1': {
      likes: 1235,
      commentCount: 46,
      comments: [
        { username: 'ava.studio', text: 'This morning light is unreal.' },
        { username: 'sam.builds', text: 'Rockaway is magic at this hour.' }
      ]
    },
    'post-2': {
      likes: 856,
      commentCount: 23,
      comments: [
        { username: 'travel.adventures', text: 'Alfama neighborhood has the best secret stairs.' },
        { username: 'priya.makes', text: 'Adding this to my wanderlust list!' }
      ]
    },
    'post-3': {
      likes: 642,
      commentCount: 18,
      comments: [
        { username: 'mike.photos', text: 'Love the stillness in this frame.' },
        { username: 'nora.eats', text: 'The natural clay tones are so calming.' }
      ]
    },
    'post-4': {
      likes: 1049,
      commentCount: 31,
      comments: [
        { username: 'maya.moves', text: 'Cedar air is pure medicine.' },
        { username: 'chris.cole', text: 'Incredible canopy scale!' }
      ]
    }
  },
  feed: 'Following',
  activeTag: 'all',
  theme: 'paper',
  soundEnabled: true,
  unreadNotifications: 3,
  profile: {
    name: 'Mike Anderson',
    bio: 'Developer, creator, and collector of small beautiful moments.\nBuilding Mikesta in public.',
    avatar: 'https://i.pravatar.cc/300?img=10'
  }
};

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored) return { ...defaultState };
    return {
      ...defaultState,
      ...stored,
      posts: Array.isArray(stored.posts) ? stored.posts : [],
      postStats: (stored.postStats && typeof stored.postStats === 'object') ? stored.postStats : defaultState.postStats,
      profile: { ...defaultState.profile, ...(stored.profile || {}) }
    };
  } catch {
    return { ...defaultState };
  }
}

const state = loadState();

const saveState = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    announce('Changes will last for this session only.', 'error');
  }
};

/* ==========================================================================
   Tactile Web Audio Synthesizer
   Zero dependencies; gentle pops and camera shutter sounds.
   ========================================================================== */
class SoundEngine {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  pop() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }
  reaction() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1040, now + 0.12);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }
  shutter() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }
}

const sounds = new SoundEngine();

/* ==========================================================================
   Toast Notifications
   ========================================================================== */
function announce(message, tone = 'default') {
  let toast = $('#toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  const icons = {
    default: '<i class="fa-solid fa-sparkles"></i>',
    error: '<i class="fa-solid fa-triangle-exclamation"></i>',
    success: '<i class="fa-solid fa-circle-check"></i>'
  };
  toast.innerHTML = `${icons[tone] || ''} <span>${escapeHtml(message)}</span>`;
  toast.dataset.tone = tone;
  toast.classList.add('visible');
  clearTimeout(announce.timeout);
  announce.timeout = setTimeout(() => toast.classList.remove('visible'), 2800);
}

/* ==========================================================================
   Themes / Vibes System
   ========================================================================== */
const THEMES = [
  { id: 'paper', label: 'Warm Paper', dot: '#e76f51' },
  { id: 'dark', label: 'Midnight Film', dot: '#ff7b5a' },
  { id: 'golden', label: 'Golden Hour', dot: '#e06038' },
  { id: 'nordic', label: 'Nordic Sage', dot: '#2d8274' }
];

function applyTheme(themeId) {
  state.theme = themeId;
  saveState();
  if (themeId === 'paper') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', themeId);
  }
  const btn = $('#vibeBtn');
  if (btn) {
    const current = THEMES.find((t) => t.id === themeId) || THEMES[0];
    const nameEl = $('.vibe-name', btn);
    const dotEl = $('.vibe-dot', btn);
    if (nameEl) nameEl.textContent = current.label;
    if (dotEl) dotEl.style.backgroundColor = current.dot;
  }
}

function showThemeMenu() {
  const menu = document.createElement('div');
  menu.className = 'choice-list';
  THEMES.forEach((theme) => {
    const isCurrent = state.theme === theme.id;
    const item = makeButton(`${theme.label}${isCurrent ? '  ✓' : ''}`, 'choice-item', { type: 'button' });
    on(item, 'click', () => {
      applyTheme(theme.id);
      closeDialog();
      announce(`Vibe set to ${theme.label}.`, 'success');
      sounds.pop();
    });
    menu.appendChild(item);
  });
  openDialog('Choose your vibe', menu, 'Aesthetic');
}

/* ==========================================================================
   Shared Dialog Component
   ========================================================================== */
function ensureDialog() {
  let dialog = $('#appDialog');
  if (dialog) return dialog;
  dialog = document.createElement('div');
  dialog.id = 'appDialog';
  dialog.className = 'app-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.innerHTML = `
    <div class="app-dialog-card">
      <div class="app-dialog-header">
        <div>
          <p class="kicker" id="dialogKicker">Mikesta</p>
          <h2 id="dialogTitle"></h2>
        </div>
        <button class="dialog-close" type="button" aria-label="Close dialog">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="app-dialog-body" id="dialogBody"></div>
    </div>
  `;
  document.body.appendChild(dialog);
  on($('.dialog-close', dialog), 'click', closeDialog);
  on(dialog, 'click', (event) => {
    if (event.target === dialog) closeDialog();
  });
  return dialog;
}

function openDialog(title, body, kicker = 'Mikesta') {
  const dialog = ensureDialog();
  $('#dialogKicker', dialog).textContent = kicker;
  $('#dialogTitle', dialog).textContent = title;
  $('#dialogBody', dialog).replaceChildren(
    body instanceof Node ? body : Object.assign(document.createElement('div'), { innerHTML: body })
  );
  dialog.classList.add('open');
  document.body.classList.add('dialog-open');
  $('.dialog-close', dialog).focus();
}

function closeDialog() {
  $('#appDialog')?.classList.remove('open');
  document.body.classList.remove('dialog-open');
}

function makeButton(text, className = 'dialog-action', attributes = {}) {
  const button = document.createElement('button');
  button.className = className;
  button.textContent = text;
  Object.entries(attributes).forEach(([key, value]) => button.setAttribute(key, value));
  return button;
}

/* ==========================================================================
   Post Data & Stats
   ========================================================================== */
function getPostId(post) {
  return post?.dataset.postId || $('.username', post)?.textContent?.trim() || 'post';
}

function getPostStats(post) {
  const id = getPostId(post);
  const likesText = $('.likes-count strong', post)?.textContent || '0';
  const commentsText = $('.view-comments', post)?.textContent || '0';
  const existing = state.postStats[id] || {};
  const stats = state.postStats[id] = {
    likes: Number.isFinite(existing.likes) ? existing.likes : (Number(likesText.replace(/\D/g, '')) || 0),
    comments: Array.isArray(existing.comments) ? existing.comments : [],
    commentCount: Number.isFinite(existing.commentCount) ? existing.commentCount : (Number(commentsText.replace(/\D/g, '')) || 0),
  };
  return stats;
}

function updatePostCounts(post, stats) {
  const likes = $('.likes-count strong', post);
  const comments = $('.view-comments', post);
  if (likes) likes.textContent = `${stats.likes.toLocaleString()} likes`;
  if (comments) comments.textContent = `View all ${stats.commentCount} comments`;

  // Render recent preview comments if container exists
  const preview = $('.post-recent-comments', post);
  if (preview && stats.comments.length) {
    const recent = stats.comments.slice(-2);
    preview.innerHTML = recent.map((c) => `
      <div class="comment-item">
        <strong>${escapeHtml(c.username)}</strong>
        <span>${escapeHtml(c.text)}</span>
      </div>
    `).join('');
  }
}

/* ==========================================================================
   Feed Switching & Hashtag Filtering
   ========================================================================== */
function showFeedMenu(button) {
  const menu = document.createElement('div');
  menu.className = 'choice-list';
  ['Following', 'For you', 'Recent'].forEach((option) => {
    const item = makeButton(`${option}${state.feed === option ? '  ✓' : ''}`, 'choice-item', { type: 'button' });
    on(item, 'click', () => {
      state.feed = option;
      saveState();
      button.innerHTML = `${option} <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>`;
      closeDialog();
      applyFeedFilter(option);
      announce(`Feed set to ${option}.`);
    });
    menu.appendChild(item);
  });
  openDialog('Choose your feed', menu, 'View');
}

function applyFeedFilter(feedType) {
  const posts = $$('.feed-section .post-card');
  posts.forEach((card, idx) => {
    card.style.display = 'block';
    if (feedType === 'Following') {
      const username = $('.username', card)?.textContent?.trim();
      const isFollowing = state.followedUsers.includes(username) || username === 'mike.photos';
      // In following mode, show followed users and user posts first
      card.style.opacity = '1';
    } else if (feedType === 'Recent') {
      // Keep natural order (newest first)
      card.style.opacity = '1';
    }
  });
}

function setupTagFilter() {
  const tags = $$('.tag-pill');
  tags.forEach((tag) => {
    on(tag, 'click', () => {
      tags.forEach((t) => t.classList.remove('active'));
      tag.classList.add('active');
      const selected = tag.dataset.tag || 'all';
      state.activeTag = selected;
      filterFeedByTag(selected);
      sounds.pop();
    });
  });
}

function filterFeedByTag(tag) {
  const posts = $$('.feed-section .post-card');
  let matched = 0;
  posts.forEach((post) => {
    const postTags = (post.dataset.tags || '').toLowerCase();
    const text = post.textContent.toLowerCase();
    if (tag === 'all' || postTags.includes(tag) || text.includes(tag)) {
      post.style.display = 'block';
      post.style.animation = 'fadeIn 0.3s ease';
      matched += 1;
    } else {
      post.style.display = 'none';
    }
  });
  if (tag !== 'all') {
    announce(`Showing ${matched} moment${matched === 1 ? '' : 's'} for #${tag}.`);
  }
}

/* ==========================================================================
   Double-Click to Like with Heart Burst
   ========================================================================== */
function setupHeartBurst(post) {
  const imageBox = $('.post-image', post);
  if (!imageBox) return;

  let lastTap = 0;
  on(imageBox, 'click', (event) => {
    const now = Date.now();
    const delta = now - lastTap;
    if (delta < 300 && delta > 0) {
      // Double tap detected!
      triggerHeartBurst(post, event);
      const likeBtn = $('.like-btn', post);
      if (likeBtn && !likeBtn.classList.contains('liked')) {
        handleLike(likeBtn);
      } else {
        sounds.pop();
      }
    }
    lastTap = now;
  });
}

function triggerHeartBurst(post, event) {
  const imageBox = $('.post-image', post);
  if (!imageBox) return;
  const burst = document.createElement('div');
  burst.className = 'heart-burst';
  burst.innerHTML = '<i class="fa-solid fa-heart"></i>';
  imageBox.appendChild(burst);
  sounds.pop();
  setTimeout(() => burst.remove(), 850);
}

/* ==========================================================================
   Inline Commenting on Feed Cards
   ========================================================================== */
function setupInlineCommentForms() {
  $$('.post-card').forEach((post) => {
    const form = $('.inline-comment-form', post);
    if (!form || form.dataset.bound) return;
    form.dataset.bound = 'true';

    const input = $('.inline-comment-input', form);
    const btn = $('.inline-comment-btn', form);

    on(input, 'input', () => {
      if (btn) btn.disabled = !input.value.trim();
    });

    on(form, 'submit', (event) => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      const stats = getPostStats(post);
      stats.comments.push({ username: 'mike.photos', text });
      stats.commentCount = Math.max(stats.commentCount + 1, stats.comments.length);
      saveState();
      updatePostCounts(post, stats);
      input.value = '';
      if (btn) btn.disabled = true;
      sounds.pop();
      announce('Comment posted.');
    });
  });
}

/* ==========================================================================
   Like, Save, Share & Post Menus
   ========================================================================== */
function handleLike(button) {
  const post = button.closest('.post-card');
  if (!post) return;
  const postId = getPostId(post);
  const stats = getPostStats(post);
  const liked = button.classList.toggle('liked');
  button.setAttribute('aria-pressed', String(liked));
  const icon = $('i', button);
  icon?.classList.toggle('fa-regular', !liked);
  icon?.classList.toggle('fa-solid', liked);

  state.likedPosts = liked ? [...new Set([...state.likedPosts, postId])] : state.likedPosts.filter((id) => id !== postId);
  stats.likes = liked ? stats.likes + 1 : Math.max(0, stats.likes - 1);
  updatePostCounts(post, stats);
  state.postStats[postId] = stats;
  saveState();

  button.animate?.([
    { transform: 'scale(1)' },
    { transform: 'scale(1.35) rotate(-10deg)' },
    { transform: 'scale(1)' }
  ], { duration: 320, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' });

  sounds.pop();
}

function handleSave(button) {
  const post = button.closest('.post-card');
  const postId = getPostId(post);
  const saved = button.classList.toggle('saved');
  button.setAttribute('aria-pressed', String(saved));
  const icon = $('i', button);
  icon?.classList.toggle('fa-regular', !saved);
  icon?.classList.toggle('fa-solid', saved);

  button.classList.add('bounce');
  setTimeout(() => button.classList.remove('bounce'), 400);

  state.savedPosts = saved ? [...new Set([...state.savedPosts, postId])] : state.savedPosts.filter((id) => id !== postId);
  saveState();
  sounds.pop();
  announce(saved ? 'Saved to your collection.' : 'Removed from saved.');
}

function handleShare(post) {
  const username = $('.username', post)?.textContent?.trim() || 'this post';
  const postUrl = window.location.href;

  if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
    navigator.share({
      title: `${username} on Mikesta`,
      text: `Check out this moment by ${username} on Mikesta!`,
      url: postUrl,
    }).catch(() => {});
    return;
  }

  const body = document.createElement('div');
  body.className = 'share-panel';
  body.innerHTML = `
    <p>Share <strong>${escapeHtml(username)}</strong>'s moment with someone who would love it.</p>
    <div class="share-options">
      <button type="button" data-share="copy"><i class="fa-solid fa-link"></i> Copy link</button>
      <button type="button" data-share="message"><i class="fa-regular fa-paper-plane"></i> Send in chat</button>
    </div>
  `;
  $$('.share-options button', body).forEach((btn) => {
    on(btn, 'click', async () => {
      const type = btn.dataset.share;
      if (type === 'copy') {
        try {
          await navigator.clipboard.writeText(postUrl);
          announce('Link copied to clipboard.', 'success');
        } catch {
          announce('Link ready to copy from your browser.');
        }
      } else {
        announce(`Direct message draft created.`);
      }
      closeDialog();
      sounds.pop();
    });
  });
  openDialog('Share moment', body, 'Pass it on');
}

function showComments(post) {
  if (!post) return;
  const stats = getPostStats(post);
  const comments = document.createElement('div');
  comments.className = 'comments-panel';

  const renderComments = () => {
    const list = stats.comments.map((c) => `
      <div class="comment">
        <strong>${escapeHtml(c.username)}</strong>
        <span>${escapeHtml(c.text)}</span>
      </div>
    `).join('');
    return list || '<p class="comment-summary">No comments yet. Be the first!</p>';
  };

  comments.innerHTML = `
    <div class="comments-list">${renderComments()}</div>
    <form class="comment-form">
      <input name="comment" maxlength="180" placeholder="Add a thoughtful note..." aria-label="Add a comment" autocomplete="off">
      <button type="submit">Post</button>
    </form>
  `;

  on($('.comment-form', comments), 'submit', (event) => {
    event.preventDefault();
    const input = $('input', event.currentTarget);
    const value = input.value.trim();
    if (!value) return;
    stats.comments.push({ username: 'mike.photos', text: value });
    stats.commentCount = Math.max(stats.commentCount + 1, stats.comments.length);
    saveState();
    updatePostCounts(post, stats);
    $('.comments-list', comments).innerHTML = renderComments();
    input.value = '';
    sounds.pop();
    announce('Comment added.');
  });

  openDialog('Comments', comments, post.querySelector('.username')?.textContent || 'Post');
}

function showPostMenu(post) {
  const menu = document.createElement('div');
  menu.className = 'choice-list';
  const copy = makeButton('Copy link to moment', 'choice-item');
  const mute = makeButton('Mute this creator', 'choice-item');
  const report = makeButton('Report inappropriate content', 'choice-item danger');

  on(copy, 'click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      announce('Post link copied.', 'success');
    } catch {
      announce('Link ready in your address bar.');
    }
    closeDialog();
  });
  on(mute, 'click', () => {
    closeDialog();
    announce('You will see fewer moments from this creator.');
  });
  on(report, 'click', () => {
    closeDialog();
    announce('Thanks for helping keep Mikesta welcoming.', 'success');
  });

  menu.append(copy, mute, report);
  openDialog('Post options', menu, 'Manage');
}

/* ==========================================================================
   Immersive Stories Viewer Experience
   ========================================================================== */
const STORIES_DATA = [
  {
    id: 'story-ava',
    username: 'ava.studio',
    avatar: 'https://i.pravatar.cc/150?img=1',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=85',
    time: '2h ago',
    location: 'Greenpoint, Brooklyn',
    caption: 'Morning study of shadows & soft ceramic textures ☕️'
  },
  {
    id: 'story-maya',
    username: 'maya.moves',
    avatar: 'https://i.pravatar.cc/150?img=2',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=85',
    time: '4h ago',
    location: 'Hudson Valley, NY',
    caption: 'Caught the sunrise right over the misty ridge line ✨'
  },
  {
    id: 'story-jon',
    username: 'jon.in.town',
    avatar: 'https://i.pravatar.cc/150?img=3',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=85',
    time: '5h ago',
    location: 'Sey Coffee, Bushwick',
    caption: 'First pour-over of the morning hits differently in autumn.'
  },
  {
    id: 'story-nora',
    username: 'nora.eats',
    avatar: 'https://i.pravatar.cc/150?img=4',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85',
    time: '7h ago',
    location: 'Baker Street Kitchen',
    caption: 'Fresh sourdough loaves right out of the oven! 🥖 Crust check.'
  },
  {
    id: 'story-sam',
    username: 'sam.builds',
    avatar: 'https://i.pravatar.cc/150?img=5',
    image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=900&q=85',
    time: '9h ago',
    location: 'East Village Studio',
    caption: 'Late night coding vibes & warm amber desk lighting 💻'
  }
];

class StoryViewer {
  constructor() {
    this.currentIndex = 0;
    this.timer = null;
    this.progress = 0;
    this.duration = 4500; // 4.5s per story
    this.isPaused = false;
    this.modal = null;
  }

  ensureModal() {
    let modal = $('#storyModal');
    if (modal) {
      this.modal = modal;
      return modal;
    }
    modal = document.createElement('div');
    modal.id = 'storyModal';
    modal.className = 'story-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="story-card">
        <div class="story-progress-container" id="storyProgress"></div>
        <div class="story-header">
          <div class="story-author-info">
            <img class="story-author-avatar" id="storyAvatar" src="" alt="">
            <div class="story-author-details">
              <span class="story-author-name" id="storyName"></span>
              <span class="story-author-meta" id="storyMeta"></span>
            </div>
          </div>
          <button class="story-close-btn" id="storyCloseBtn" aria-label="Close story">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="story-content-area">
          <img class="story-image" id="storyImage" src="" alt="Story photo">
          <div class="story-nav-zone story-nav-left" id="storyNavLeft" title="Previous story"></div>
          <div class="story-nav-zone story-nav-right" id="storyNavRight" title="Next story"></div>
          <div class="story-caption-box" id="storyCaption"></div>
        </div>
        <div class="story-bottom-bar">
          <div class="story-reaction-pills">
            <button class="story-emoji-btn" data-emoji="❤️">❤️</button>
            <button class="story-emoji-btn" data-emoji="🔥">🔥</button>
            <button class="story-emoji-btn" data-emoji="✨">✨</button>
            <button class="story-emoji-btn" data-emoji="👏">👏</button>
            <button class="story-emoji-btn" data-emoji="☕️">☕️</button>
          </div>
          <form class="story-reply-form" id="storyReplyForm">
            <input class="story-reply-input" placeholder="Reply to story..." maxlength="120">
            <button type="submit" class="story-reply-send">Send</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.modal = modal;
    this.bindEvents();
    return modal;
  }

  bindEvents() {
    on($('#storyCloseBtn', this.modal), 'click', () => this.close());
    on($('#storyNavLeft', this.modal), 'click', () => this.prev());
    on($('#storyNavRight', this.modal), 'click', () => this.next());

    // Pause on hold
    const card = $('.story-card', this.modal);
    on(card, 'mousedown', () => this.pause());
    on(card, 'mouseup', () => this.resume());
    on(card, 'touchstart', () => this.pause(), { passive: true });
    on(card, 'touchend', () => this.resume());

    // Reaction emojis
    $$('.story-emoji-btn', this.modal).forEach((btn) => {
      on(btn, 'click', (e) => {
        const emoji = btn.dataset.emoji;
        this.spawnFloatingEmoji(emoji, e.clientX, e.clientY);
        sounds.reaction();
      });
    });

    // Story reply
    on($('#storyReplyForm', this.modal), 'submit', (e) => {
      e.preventDefault();
      const input = $('.story-reply-input', this.modal);
      const text = input.value.trim();
      if (!text) return;
      const current = STORIES_DATA[this.currentIndex];
      announce(`Reply sent to ${current.username}!`, 'success');
      input.value = '';
      sounds.reaction();
    });

    // Keyboard navigation
    on(document, 'keydown', (e) => {
      if (!this.modal?.classList.contains('active')) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        this.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      } else if (e.key === 'Escape') {
        this.close();
      }
    });
  }

  open(startIndex = 0) {
    this.ensureModal();
    this.currentIndex = Math.max(0, Math.min(startIndex, STORIES_DATA.length - 1));
    this.renderProgressBars();
    this.loadStory(this.currentIndex);
    this.modal.classList.add('active');
    document.body.classList.add('dialog-open');
    sounds.pop();
  }

  close() {
    clearInterval(this.timer);
    this.modal?.classList.remove('active');
    document.body.classList.remove('dialog-open');
  }

  renderProgressBars() {
    const container = $('#storyProgress', this.modal);
    if (!container) return;
    container.innerHTML = STORIES_DATA.map((_, i) => `
      <div class="story-progress-bar">
        <div class="story-progress-fill" id="progress-${i}"></div>
      </div>
    `).join('');
  }

  loadStory(index) {
    clearInterval(this.timer);
    const story = STORIES_DATA[index];
    if (!story) return this.close();

    $('#storyAvatar', this.modal).src = story.avatar;
    $('#storyName', this.modal).textContent = story.username;
    $('#storyMeta', this.modal).textContent = `${story.time} · ${story.location}`;
    $('#storyImage', this.modal).src = story.image;
    $('#storyCaption', this.modal).textContent = story.caption;

    // Update progress bars
    STORIES_DATA.forEach((_, i) => {
      const fill = $(`#progress-${i}`, this.modal);
      if (!fill) return;
      if (i < index) {
        fill.style.width = '100%';
      } else if (i > index) {
        fill.style.width = '0%';
      } else {
        fill.style.width = '0%';
      }
    });

    this.progress = 0;
    const interval = 50;
    const step = (interval / this.duration) * 100;

    this.timer = setInterval(() => {
      if (this.isPaused) return;
      this.progress += step;
      const currentFill = $(`#progress-${index}`, this.modal);
      if (currentFill) {
        currentFill.style.width = `${Math.min(100, this.progress)}%`;
      }
      if (this.progress >= 100) {
        this.next();
      }
    }, interval);
  }

  next() {
    if (this.currentIndex < STORIES_DATA.length - 1) {
      this.currentIndex += 1;
      this.loadStory(this.currentIndex);
    } else {
      this.close();
      announce('Caught up with all stories ✨', 'success');
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex -= 1;
      this.loadStory(this.currentIndex);
    } else {
      this.loadStory(0);
    }
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  spawnFloatingEmoji(emoji, clientX, clientY) {
    const card = $('.story-card', this.modal);
    if (!card) return;
    for (let i = 0; i < 4; i++) {
      const el = document.createElement('span');
      el.className = 'floating-emoji';
      el.textContent = emoji;
      el.style.left = `${(card.clientWidth / 2) + (Math.random() * 80 - 40)}px`;
      el.style.bottom = `${80 + (Math.random() * 20)}px`;
      el.style.animationDelay = `${i * 0.1}s`;
      card.appendChild(el);
      setTimeout(() => el.remove(), 1800);
    }
  }
}

const storyViewer = new StoryViewer();

function showStory(storyElement) {
  if (storyElement.classList.contains('story-add')) {
    openUploadModal();
    return;
  }
  const username = $('.story-item span:last-child', storyElement)?.textContent?.trim();
  const index = STORIES_DATA.findIndex((s) => s.username === username);
  storyViewer.open(index >= 0 ? index : 0);
  storyElement.classList.add('viewed');
}

/* ==========================================================================
   Create Post & Photo Filters Flow
   ========================================================================== */
const FILTER_PRESETS = [
  { id: 'filter-none', label: 'Normal', class: '' },
  { id: 'filter-vintage', label: 'Vintage', class: 'filter-vintage' },
  { id: 'filter-golden', label: 'Golden', class: 'filter-golden' },
  { id: 'filter-noir', label: 'Noir', class: 'filter-noir' },
  { id: 'filter-cyber', label: 'Cyber', class: 'filter-cyber' },
  { id: 'filter-pastel', label: 'Pastel', class: 'filter-pastel' },
  { id: 'filter-vivid', label: 'Vivid', class: 'filter-vivid' }
];

let currentSelectedFilter = '';

function setupUpload() {
  const modal = $('#uploadModal');
  const uploadBtn = $('#uploadBtn');
  const close = $('#closeModal');
  const cancel = $('#cancelBtn');
  const select = $('#selectFileBtn');
  const input = $('#fileInput');
  const area = $('#uploadArea');
  const previewArea = $('#previewArea');
  const preview = $('#previewImage');

  const open = () => {
    modal?.classList.add('active');
    document.body.classList.add('dialog-open');
    $('.close-modal', modal)?.focus();
    sounds.pop();
  };

  const reset = () => {
    if (!modal) return;
    area.style.display = 'flex';
    previewArea.style.display = 'none';
    preview.removeAttribute('src');
    preview.className = '';
    currentSelectedFilter = '';
    input.value = '';
    $('#captionInput').value = '';
    $('#locationInput').value = '';
  };

  const closeModal = () => {
    modal?.classList.remove('active');
    document.body.classList.remove('dialog-open');
    reset();
  };

  window.openUploadModal = open;

  on(uploadBtn, 'click', open);
  on($('#mobileCreateBtn'), 'click', open);
  on(close, 'click', closeModal);
  on(cancel, 'click', closeModal);
  on(modal, 'click', (e) => { if (e.target === modal) closeModal(); });
  on(select, 'click', () => input.click());

  // Filter selection chips setup
  setupFilterChips();

  const previewFile = (file) => {
    if (!file?.type.startsWith('image/')) {
      announce('Please choose an image file.', 'error');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      announce('Images must be smaller than 10 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      area.style.display = 'none';
      previewArea.style.display = 'grid';
      sounds.pop();
    };
    reader.onerror = () => announce('Image could not be read. Try another.', 'error');
    reader.readAsDataURL(file);
  };

  on(input, 'change', () => previewFile(input.files?.[0]));
  on(area, 'dragover', (e) => { e.preventDefault(); area.classList.add('drag-over'); });
  on(area, 'dragleave', () => area.classList.remove('drag-over'));
  on(area, 'drop', (e) => {
    e.preventDefault();
    area.classList.remove('drag-over');
    previewFile(e.dataTransfer.files?.[0]);
  });

  on($('#shareBtn'), 'click', () => {
    if (!preview.src) {
      announce('Choose a photo before sharing.', 'error');
      return;
    }
    const caption = $('#captionInput').value.trim();
    const location = $('#locationInput').value.trim();
    createNewPost({
      caption,
      location,
      imageSrc: preview.src,
      username: 'mike.photos',
      filter: currentSelectedFilter
    });
    closeModal();
    sounds.shutter();
    announce('Your moment is live in your circle.', 'success');
  });
}

function setupFilterChips() {
  const container = $('#filterPills');
  if (!container) return;
  container.innerHTML = FILTER_PRESETS.map((f, i) => `
    <button type="button" class="filter-chip ${i === 0 ? 'active' : ''}" data-filter="${f.class}">
      ${f.label}
    </button>
  `).join('');

  $$('.filter-chip', container).forEach((chip) => {
    on(chip, 'click', () => {
      $$('.filter-chip', container).forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      currentSelectedFilter = chip.dataset.filter || '';
      const preview = $('#previewImage');
      if (preview) {
        preview.className = currentSelectedFilter;
      }
      sounds.pop();
    });
  });
}

function createNewPost({
  id = `local-${Date.now()}`,
  caption = '',
  location = '',
  imageSrc = '',
  username = 'mike.photos',
  filter = '',
  createdAt = new Date().toISOString()
}, persist = true) {
  const feed = $('.feed-section');
  if (!feed) return;

  const post = document.createElement('article');
  post.className = 'post-card new-post';
  post.dataset.postId = id;
  post.dataset.tags = 'all featured';

  post.innerHTML = `
    <div class="post-header">
      <div class="user-info">
        <img src="${escapeHtml(state.profile.avatar)}" alt="${escapeHtml(username)}" class="user-avatar">
        <div class="user-details">
          <span class="username">${escapeHtml(username)} <i class="fa-solid fa-circle-check verified" aria-label="Verified"></i></span>
          <span class="location">${escapeHtml(location || 'Shared just now')}</span>
        </div>
      </div>
      <button class="post-options" aria-label="More options"><i class="fa-solid fa-ellipsis"></i></button>
    </div>
    <div class="post-image">
      <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(caption || 'Moment shared on Mikesta')}" class="${escapeHtml(filter)}">
    </div>
    <div class="post-actions">
      <div class="action-buttons">
        <button class="action-btn like-btn" aria-label="Like post" aria-pressed="false"><i class="fa-regular fa-heart"></i></button>
        <button class="action-btn" aria-label="Comment"><i class="fa-regular fa-comment"></i></button>
        <button class="action-btn" aria-label="Share"><i class="fa-regular fa-paper-plane"></i></button>
      </div>
      <button class="action-btn save-btn" aria-label="Save post" aria-pressed="false"><i class="fa-regular fa-bookmark"></i></button>
    </div>
    <div class="post-info">
      <div class="likes-count"><strong>0 likes</strong></div>
      <div class="post-caption"><strong>${escapeHtml(username)}</strong> ${escapeHtml(caption || 'A small moment worth keeping.')}</div>
      <button class="view-comments">View all 0 comments</button>
      <div class="post-recent-comments"></div>
      <div class="post-time">${persist ? 'JUST NOW' : 'SHARED EARLIER'}</div>
    </div>
    <form class="inline-comment-form">
      <input type="text" class="inline-comment-input" placeholder="Add a comment..." maxlength="200" aria-label="Add a comment">
      <button type="submit" class="inline-comment-btn" disabled>Post</button>
    </form>
  `;

  feed.prepend(post);
  setupHeartBurst(post);

  state.postStats[id] = state.postStats[id] || { likes: 0, comments: [], commentCount: 0 };
  updatePostCounts(post, state.postStats[id]);

  if (persist) {
    state.posts = [{ id, caption, location, imageSrc, username, filter, createdAt }, ...state.posts.filter((p) => p.id !== id)];
    saveState();
    post.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function hydratePosts() {
  [...state.posts].reverse().forEach((p) => createNewPost(p, false));
}

/* ==========================================================================
   Follow Suggestions
   ========================================================================== */
function handleFollow(button) {
  const item = button.closest('.suggestion-item');
  const username = $('.suggestion-username', item)?.textContent || 'creator';
  const following = button.classList.toggle('following');
  button.textContent = following ? 'Following' : 'Follow';
  state.followedUsers = following ? [...new Set([...state.followedUsers, username])] : state.followedUsers.filter((u) => u !== username);
  saveState();
  sounds.pop();
  announce(following ? `Following ${username}.` : `Unfollowed ${username}.`);
}

/* ==========================================================================
   Interactive Live Search Dropdown
   ========================================================================== */
const SEARCH_DATABASE = [
  { type: 'user', title: 'mike.photos', subtitle: 'Mike Anderson · Creator', avatar: 'https://i.pravatar.cc/150?img=10' },
  { type: 'user', title: 'ava.studio', subtitle: 'Ava Lin · Architectural Ceramicist', avatar: 'https://i.pravatar.cc/150?img=1' },
  { type: 'user', title: 'maya.moves', subtitle: 'Maya Santos · Dancer & Light', avatar: 'https://i.pravatar.cc/150?img=2' },
  { type: 'user', title: 'jon.in.town', subtitle: 'Jon Sterling · Specialty Coffee', avatar: 'https://i.pravatar.cc/150?img=3' },
  { type: 'user', title: 'sam.builds', subtitle: 'Samir Patel · Systems & Spaces', avatar: 'https://i.pravatar.cc/150?img=5' },
  { type: 'tag', title: '#coast', subtitle: 'Ocean, waves, and shore light' },
  { type: 'tag', title: '#coffee', subtitle: 'Morning brews & cafe studies' },
  { type: 'tag', title: '#architecture', subtitle: 'Concrete, wood, and clean geometries' },
  { type: 'place', title: 'Rockaway Beach, NY', subtitle: 'Ocean vibes and Atlantic sunsets' },
  { type: 'place', title: 'Lisbon, Portugal', subtitle: 'Historic yellow trams & terracotta roofs' }
];

function setupSearch() {
  const input = $('.search-bar input');
  const dropdown = $('#searchDropdown');
  const clearBtn = $('#searchClearBtn');
  if (!input || !dropdown) return;

  const performSearch = (query) => {
    if (!query) {
      dropdown.classList.remove('open');
      if (clearBtn) clearBtn.classList.remove('visible');
      return;
    }
    if (clearBtn) clearBtn.classList.add('visible');

    const matches = SEARCH_DATABASE.filter((item) =>
      item.title.toLowerCase().includes(query) || item.subtitle.toLowerCase().includes(query)
    );

    if (!matches.length) {
      dropdown.innerHTML = `<div style="padding: 12px; font-size: 11px; color: var(--muted); text-align: center;">No results for “${escapeHtml(query)}”</div>`;
    } else {
      dropdown.innerHTML = matches.map((item) => `
        <button type="button" class="search-item" data-query="${escapeHtml(item.title)}">
          ${item.avatar ? `<img src="${item.avatar}" alt="">` : `<div class="search-tag-icon"><i class="fa-solid ${item.type === 'tag' ? 'fa-hashtag' : 'fa-location-dot'}"></i></div>`}
          <div class="search-item-info">
            <span class="search-item-title">${escapeHtml(item.title)}</span>
            <span class="search-item-subtitle">${escapeHtml(item.subtitle)}</span>
          </div>
        </button>
      `).join('');
    }
    dropdown.classList.add('open');

    $$('.search-item', dropdown).forEach((item) => {
      on(item, 'click', () => {
        const value = item.dataset.query;
        input.value = value;
        dropdown.classList.remove('open');
        filterFeedByQuery(value);
      });
    });
  };

  on(input, 'input', () => performSearch(input.value.trim().toLowerCase()));

  on(input, 'keydown', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim().toLowerCase();
      dropdown.classList.remove('open');
      filterFeedByQuery(q);
    } else if (e.key === 'Escape') {
      dropdown.classList.remove('open');
    }
  });

  on(clearBtn, 'click', () => {
    input.value = '';
    clearBtn.classList.remove('visible');
    dropdown.classList.remove('open');
    filterFeedByTag('all');
  });

  on(document, 'click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
      dropdown.classList.remove('open');
    }
  });
}

function filterFeedByQuery(query) {
  if (!query) return;
  const clean = query.replace(/^#/, '').toLowerCase();
  const posts = $$('.feed-section .post-card');
  let matched = 0;
  posts.forEach((card) => {
    const text = card.textContent.toLowerCase();
    const tags = (card.dataset.tags || '').toLowerCase();
    if (text.includes(clean) || tags.includes(clean)) {
      card.style.display = 'block';
      card.classList.add('highlight');
      setTimeout(() => card.classList.remove('highlight'), 1600);
      if (matched === 0) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      matched += 1;
    } else {
      card.style.display = 'none';
    }
  });
  announce(matched ? `Found ${matched} moment${matched === 1 ? '' : 's'} matching “${query}”.` : `No moments found for “${query}”.`, matched ? 'default' : 'error');
}

/* ==========================================================================
   Notifications Center
   ========================================================================== */
const NOTIFICATIONS_DATA = [
  { user: 'ava.studio', avatar: 'https://i.pravatar.cc/100?img=1', action: 'liked your photo from Rockaway Beach.', time: '12m ago', type: 'likes' },
  { user: 'chris.cole', avatar: 'https://i.pravatar.cc/100?img=12', action: 'started following your creative circle.', time: '1h ago', type: 'follows' },
  { user: 'sam.builds', avatar: 'https://i.pravatar.cc/100?img=5', action: 'mentioned you: “Adding this to my weekend list!”', time: '3h ago', type: 'mentions' },
  { user: 'nora.eats', avatar: 'https://i.pravatar.cc/100?img=4', action: 'saved your post to “Weekend Light”.', time: '6h ago', type: 'likes' }
];

function showNotifications() {
  const badge = $('#notifBadge');
  if (badge) badge.classList.remove('active');
  state.unreadNotifications = 0;
  saveState();

  const body = document.createElement('div');
  body.className = 'notification-panel';
  body.innerHTML = `
    <div class="notification-tabs">
      <button class="notif-tab active" data-tab="all">All</button>
      <button class="notif-tab" data-tab="mentions">Mentions</button>
      <button class="notif-tab" data-tab="likes">Likes</button>
    </div>
    <div class="notification-list" id="notifList"></div>
  `;

  const renderNotifs = (filterTab = 'all') => {
    const list = $('#notifList', body);
    const filtered = NOTIFICATIONS_DATA.filter((n) => filterTab === 'all' || n.type === filterTab);
    list.innerHTML = filtered.map((n) => `
      <div class="notification-item">
        <img src="${n.avatar}" alt="${escapeHtml(n.user)}">
        <p><strong>${escapeHtml(n.user)}</strong> ${escapeHtml(n.action)}<small>${n.time}</small></p>
      </div>
    `).join('');
  };

  renderNotifs('all');

  $$('.notif-tab', body).forEach((tab) => {
    on(tab, 'click', () => {
      $$('.notif-tab', body).forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      renderNotifs(tab.dataset.tab);
      sounds.pop();
    });
  });

  openDialog('Notifications', body, 'Your activity');
  sounds.pop();
}

/* ==========================================================================
   Post Lightbox Modal (Full Photo & Comments Inspector)
   ========================================================================== */
function openLightbox(postData) {
  let modal = $('#lightboxModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'lightboxModal';
    modal.className = 'lightbox-modal';
    modal.setAttribute('role', 'dialog');
    modal.innerHTML = `
      <div class="lightbox-card">
        <div class="lightbox-media">
          <img id="lightboxImg" src="" alt="">
        </div>
        <div class="lightbox-sidebar">
          <div class="lightbox-header">
            <div class="user-info">
              <img id="lightboxAvatar" src="" alt="" class="user-avatar">
              <div class="user-details">
                <span class="username" id="lightboxUser"></span>
                <span class="location" id="lightboxLoc"></span>
              </div>
            </div>
            <button class="dialog-close" id="lightboxClose" aria-label="Close">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="lightbox-comments-list" id="lightboxComments"></div>
          <div class="lightbox-actions">
            <form class="inline-comment-form" id="lightboxCommentForm">
              <input type="text" class="inline-comment-input" placeholder="Add a comment..." maxlength="180">
              <button type="submit" class="inline-comment-btn">Post</button>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    on($('#lightboxClose', modal), 'click', () => {
      modal.classList.remove('active');
      document.body.classList.remove('dialog-open');
    });
    on(modal, 'click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.classList.remove('dialog-open');
      }
    });
  }

  $('#lightboxImg', modal).src = postData.image;
  $('#lightboxAvatar', modal).src = postData.avatar || state.profile.avatar;
  $('#lightboxUser', modal).textContent = postData.username;
  $('#lightboxLoc', modal).textContent = postData.location || 'Moment';

  const commentsContainer = $('#lightboxComments', modal);
  const comments = postData.comments || [
    { username: postData.username, text: postData.caption || 'Captured moment.' },
    { username: 'ava.studio', text: 'Beautiful composition!' }
  ];

  const renderComments = () => {
    commentsContainer.innerHTML = comments.map((c) => `
      <div class="lightbox-comment">
        <div>
          <strong>${escapeHtml(c.username)}</strong>
          <p>${escapeHtml(c.text)}</p>
        </div>
      </div>
    `).join('');
  };
  renderComments();

  const form = $('#lightboxCommentForm', modal);
  form.onsubmit = (e) => {
    e.preventDefault();
    const input = $('.inline-comment-input', form);
    const val = input.value.trim();
    if (!val) return;
    comments.push({ username: 'mike.photos', text: val });
    renderComments();
    input.value = '';
    sounds.pop();
    announce('Comment added.');
  };

  modal.classList.add('active');
  document.body.classList.add('dialog-open');
  sounds.pop();
}

/* ==========================================================================
   Profile Page Functions
   ========================================================================== */
function setupProfilePage() {
  const edit = $('.button-outline');
  if (edit) {
    on(edit, 'click', () => {
      const body = document.createElement('form');
      body.className = 'edit-form';
      body.innerHTML = `
        <label>Display name
          <input name="name" maxlength="40" value="${escapeHtml(state.profile.name)}">
        </label>
        <label>Avatar URL
          <input name="avatar" value="${escapeHtml(state.profile.avatar)}">
        </label>
        <label>Bio
          <textarea name="bio" maxlength="160">${escapeHtml(state.profile.bio)}</textarea>
        </label>
        <button class="dialog-action" type="submit">Save changes</button>
      `;
      on(body, 'submit', (event) => {
        event.preventDefault();
        state.profile.name = $('input[name="name"]', body).value.trim() || state.profile.name;
        state.profile.avatar = $('input[name="avatar"]', body).value.trim() || state.profile.avatar;
        state.profile.bio = $('textarea[name="bio"]', body).value.trim() || state.profile.bio;
        saveState();
        applyProfile();
        closeDialog();
        sounds.pop();
        announce('Profile updated.', 'success');
      });
      openDialog('Edit profile', body, 'Your profile');
    });
  }

  // Profile tabs: Posts vs Saved
  $$('.profile-tabs button').forEach((tab, index) => {
    on(tab, 'click', () => {
      $$('.profile-tabs button').forEach((item) => item.classList.remove('active'));
      tab.classList.add('active');
      sounds.pop();
      if (index === 1) {
        renderSavedProfileGrid();
        announce('Showing your saved collection.');
      } else {
        hydrateProfilePosts();
        announce('Showing your posts.');
      }
    });
  });

  hydrateProfilePosts();
  applyProfile();
  setupProfileGridLightbox();
}

function applyProfile() {
  const title = $('.profile-title-row h1');
  const bio = $('.profile-bio');
  const avatar = $('.profile-large-avatar');
  if (title) title.firstChild.textContent = 'mike.photos ';
  if (bio) bio.innerHTML = escapeHtml(state.profile.bio).replace(/\n/g, '<br>');
  if (avatar) avatar.src = state.profile.avatar;
}

function hydrateProfilePosts() {
  const grid = $('.profile-grid');
  if (!grid) return;
  grid.classList.remove('saved-view');
  $$('.user-post-tile, .profile-grid-item', grid).forEach((el) => el.remove());

  // User created posts
  [...state.posts].forEach((post) => {
    const item = document.createElement('div');
    item.className = 'profile-grid-item user-post-tile';
    item.dataset.postId = post.id;
    item.innerHTML = `
      <img src="${escapeHtml(post.imageSrc)}" alt="${escapeHtml(post.caption || 'Moment by Mike')}" class="${escapeHtml(post.filter || '')}">
      <div class="grid-hover-overlay">
        <span><i class="fa-solid fa-heart"></i> ${state.postStats[post.id]?.likes || 0}</span>
        <span><i class="fa-solid fa-comment"></i> ${state.postStats[post.id]?.commentCount || 0}</span>
      </div>
    `;
    grid.prepend(item);
  });

  const postCount = $('.profile-stats strong');
  if (postCount) postCount.textContent = String(24 + state.posts.length);
  setupProfileGridLightbox();
}

function renderSavedProfileGrid() {
  const grid = $('.profile-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const savedIds = state.savedPosts;
  if (!savedIds.length) {
    grid.innerHTML = `
      <div class="empty-saved-state">
        <i class="fa-regular fa-bookmark"></i>
        <h3>No saved moments yet</h3>
        <p>Tap the bookmark icon on any photo in your circle to save it to your private library.</p>
      </div>
    `;
    return;
  }

  // Pre-seed library images for saved items
  const seedSaved = {
    'post-1': { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', user: 'mike.photos', likes: 1235 },
    'post-2': { src: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=800&q=80', user: 'travel.adventures', likes: 856 },
    'post-3': { src: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80', user: 'ava.studio', likes: 642 },
    'post-4': { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', user: 'sam.builds', likes: 1049 }
  };

  savedIds.forEach((id) => {
    const userPost = state.posts.find((p) => p.id === id);
    const item = document.createElement('div');
    item.className = 'profile-grid-item';
    const src = userPost ? userPost.imageSrc : (seedSaved[id]?.src || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80');
    const author = userPost ? userPost.username : (seedSaved[id]?.user || 'creator');
    const likes = userPost ? (state.postStats[id]?.likes || 0) : (seedSaved[id]?.likes || 120);

    item.innerHTML = `
      <img src="${escapeHtml(src)}" alt="Saved moment">
      <div class="grid-hover-overlay">
        <span><i class="fa-solid fa-heart"></i> ${likes}</span>
        <span>${escapeHtml(author)}</span>
      </div>
    `;
    grid.appendChild(item);
  });
  setupProfileGridLightbox();
}

function setupProfileGridLightbox() {
  $$('.profile-grid-item, .profile-grid img').forEach((el) => {
    if (el.dataset.lightboxBound) return;
    el.dataset.lightboxBound = 'true';
    on(el, 'click', () => {
      const img = el.tagName === 'IMG' ? el : $('img', el);
      if (!img) return;
      openLightbox({
        image: img.src,
        username: 'mike.photos',
        caption: img.alt || 'Moments from my circle.',
        location: 'New York, NY'
      });
    });
  });
}

/* ==========================================================================
   State Restoration & Initialization
   ========================================================================== */
function restoreState() {
  applyTheme(state.theme);

  // Sound toggle button in nav
  const soundBtn = $('#soundBtn');
  if (soundBtn) {
    soundBtn.classList.toggle('muted', !state.soundEnabled);
    soundBtn.innerHTML = state.soundEnabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
    on(soundBtn, 'click', () => {
      state.soundEnabled = !state.soundEnabled;
      saveState();
      soundBtn.classList.toggle('muted', !state.soundEnabled);
      soundBtn.innerHTML = state.soundEnabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
      if (state.soundEnabled) sounds.pop();
      announce(state.soundEnabled ? 'Audio vibes on.' : 'Audio vibes muted.');
    });
  }

  // Vibe picker button
  const vibeBtn = $('#vibeBtn');
  if (vibeBtn) {
    on(vibeBtn, 'click', showThemeMenu);
  }

  // Restore post likes & saves
  $$('.post-card').forEach((post) => {
    const id = getPostId(post);
    const stats = getPostStats(post);
    const like = $('.like-btn', post);
    const save = $('.save-btn', post);
    updatePostCounts(post, stats);
    setupHeartBurst(post);

    if (state.likedPosts.includes(id)) {
      like?.classList.add('liked');
      like?.setAttribute('aria-pressed', 'true');
      $('i', like)?.classList.replace('fa-regular', 'fa-solid');
    }
    if (state.savedPosts.includes(id)) {
      save?.classList.add('saved');
      save?.setAttribute('aria-pressed', 'true');
      $('i', save)?.classList.replace('fa-regular', 'fa-solid');
    }
  });

  // Restore followed users
  $$('.follow-btn').forEach((button) => {
    const username = $('.suggestion-username', button.closest('.suggestion-item'))?.textContent;
    if (state.followedUsers.includes(username)) {
      button.classList.add('following');
      button.textContent = 'Following';
    }
  });

  // Notification badge
  const badge = $('#notifBadge');
  if (badge && state.unreadNotifications > 0) {
    badge.classList.add('active');
  }

  saveState();
}

function setupEvents() {
  setupUpload();
  setupSearch();
  setupTagFilter();
  setupProfilePage();
  hydratePosts();
  setupInlineCommentForms();
  restoreState();

  const filter = $('.feed-filter');
  if (filter) {
    filter.innerHTML = `${state.feed} <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>`;
    on(filter, 'click', (event) => showFeedMenu(event.currentTarget));
  }

  on($('.stories-heading button'), 'click', () => {
    storyViewer.open(0);
  });

  on($('.see-all'), 'click', () => announce('Viewing all recommended creators.'));
  on($('.nav-icons button[title="Notifications"]'), 'click', showNotifications);
  on($('#mobileNotifBtn'), 'click', showNotifications);

  // Global delegation
  document.addEventListener('click', (event) => {
    const target = event.target.closest('button, .story-item');
    if (!target) return;
    const post = target.closest('.post-card');

    if (target.matches('.like-btn')) return handleLike(target);
    if (target.matches('.save-btn')) return handleSave(target);
    if (target.matches('.view-comments, .action-btn[aria-label="Comment"]')) return showComments(post);
    if (target.matches('.action-btn[aria-label="Share"]')) return handleShare(post);
    if (target.matches('.post-options')) return showPostMenu(post);
    if (target.matches('.story-item')) return showStory(target);
    if (target.matches('.follow-btn')) return handleFollow(target);
  });
}

on(document, 'keydown', (event) => {
  if (event.key === 'Escape') {
    closeDialog();
  }
});

// Start app
setupEvents();

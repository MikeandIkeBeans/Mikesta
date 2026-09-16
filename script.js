const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const isElement = (value) => value instanceof Element;
const STORAGE_KEY = 'mikesta-state-v2';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const defaultState = {
  likedPosts: [],
  savedPosts: [],
  followedUsers: [],
  posts: [],
  postStats: {},
  feed: 'Following',
  notificationsOpen: false,
  profile: { name: 'Mike Anderson', bio: 'Developer, creator, and collector of small beautiful moments.\nBuilding Mikesta in public.' },
};

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultState, ...stored, posts: Array.isArray(stored?.posts) ? stored.posts : [], postStats: stored?.postStats && typeof stored.postStats === 'object' ? stored.postStats : {}, profile: { ...defaultState.profile, ...(stored?.profile || {}) } };
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
const on = (element, event, handler) => element?.addEventListener(event, handler);
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

function announce(message, tone = 'default') {
  let toast = $('#toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.classList.add('visible');
  clearTimeout(announce.timeout);
  announce.timeout = setTimeout(() => toast.classList.remove('visible'), 2800);
}

function ensureDialog() {
  let dialog = $('#appDialog');
  if (dialog) return dialog;
  dialog = document.createElement('div');
  dialog.id = 'appDialog';
  dialog.className = 'app-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.innerHTML = '<div class="app-dialog-card"><div class="app-dialog-header"><div><p class="kicker" id="dialogKicker">Mikesta</p><h2 id="dialogTitle"></h2></div><button class="dialog-close" type="button" aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button></div><div class="app-dialog-body" id="dialogBody"></div></div>';
  document.body.appendChild(dialog);
  on($('.dialog-close', dialog), 'click', closeDialog);
  on(dialog, 'click', (event) => { if (event.target === dialog) closeDialog(); });
  return dialog;
}

function openDialog(title, body, kicker = 'Mikesta') {
  const dialog = ensureDialog();
  $('#dialogKicker', dialog).textContent = kicker;
  $('#dialogTitle', dialog).textContent = title;
  $('#dialogBody', dialog).replaceChildren(body instanceof Node ? body : Object.assign(document.createElement('div'), { innerHTML: body }));
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
  if (!stats.comments.length && stats.commentCount > 0) {
    const username = $('.username', post)?.textContent?.trim() || 'someone';
    stats.comments = [
      { username: 'ava.studio', text: 'This light is unreal.' },
      { username: 'sam.builds', text: 'Adding this to my weekend list.' },
    ].map((comment) => ({ ...comment, post: username }));
  }
  return stats;
}

function updatePostCounts(post, stats) {
  const likes = $('.likes-count strong', post);
  const comments = $('.view-comments', post);
  if (likes) likes.textContent = `${stats.likes.toLocaleString()} likes`;
  if (comments) comments.textContent = `View all ${stats.commentCount} comments`;
}

function showNotifications() {
  const body = document.createElement('div');
  body.className = 'notification-list';
  body.innerHTML = '<div class="notification-item"><img src="https://i.pravatar.cc/100?img=1" alt="Ava"><p><strong>ava.studio</strong> liked your photo.<small>12 minutes ago</small></p></div><div class="notification-item"><img src="https://i.pravatar.cc/100?img=12" alt="Chris"><p><strong>chris.cole</strong> started following you.<small>1 hour ago</small></p></div><div class="notification-item"><img src="https://i.pravatar.cc/100?img=5" alt="Sam"><p><strong>sam.builds</strong> mentioned you in a comment.<small>3 hours ago</small></p></div>';
  openDialog('Notifications', body, 'Your activity');
}

function showFeedMenu(button) {
  const menu = document.createElement('div');
  menu.className = 'choice-list';
  ['Following', 'For you', 'Recent'].forEach((option) => {
    const item = makeButton(`${option}${state.feed === option ? '  ✓' : ''}`, 'choice-item', { type: 'button' });
    on(item, 'click', () => { state.feed = option; saveState(); button.innerHTML = `${option} <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>`; closeDialog(); announce(`Feed set to ${option}.`); });
    menu.appendChild(item);
  });
  openDialog('Choose your feed', menu, 'View');
}

function showStory(story) {
  if (story.classList.contains('story-add')) { openUploadModal(); return; }
  const username = $('.story-item span:last-child', story)?.textContent || 'your circle';
  const image = $('img', story);
  const body = document.createElement('div');
  body.className = 'story-viewer';
  body.innerHTML = `<img src="${image.src}" alt="${escapeHtml(username)} story"><div><p class="kicker">Story preview</p><h3>${escapeHtml(username)}</h3><p>Small moments, shared while they are still warm.</p></div>`;
  openDialog(username, body, 'Now');
}

function showComments(post) {
  if (!post) return;
  const stats = getPostStats(post);
  const comments = document.createElement('div');
  comments.className = 'comments-panel';
  const visibleComments = stats.comments.map((comment) => `<div class="comment"><strong>${escapeHtml(comment.username)}</strong><span>${escapeHtml(comment.text)}</span></div>`).join('');
  const remaining = Math.max(0, stats.commentCount - stats.comments.length);
  comments.innerHTML = `${visibleComments}<p class="comment-summary">Showing ${stats.comments.length} of ${stats.commentCount} comments</p>${remaining ? '<button type="button" class="load-comments">Load remaining comments</button>' : ''}<form class="comment-form"><input name="comment" maxlength="180" placeholder="Add a comment..." aria-label="Add a comment"><button type="submit">Post</button></form>`;
  on($('.load-comments', comments), 'click', (event) => {
    for (let index = 0; index < remaining; index += 1) stats.comments.push({ username: `friend_${index + 1}`, text: 'A lovely moment.' });
    stats.commentCount = stats.comments.length;
    saveState();
    showComments(post);
    announce('All comments loaded.');
  });
  on($('.comment-form', comments), 'submit', (event) => { event.preventDefault(); const input = $('input', event.currentTarget); const value = input.value.trim(); if (!value) return; stats.comments.push({ username: 'mike.photos', text: value }); stats.commentCount = Math.max(stats.commentCount + 1, stats.comments.length); saveState(); updatePostCounts(post, stats); closeDialog(); announce('Comment added.'); });
  openDialog('Comments', comments, post.querySelector('.username')?.textContent || 'Post');
}

function showPostMenu(post) {
  const menu = document.createElement('div');
  menu.className = 'choice-list';
  const report = makeButton('Report post', 'choice-item danger');
  const copy = makeButton('Copy link', 'choice-item');
  const mute = makeButton('Mute this account', 'choice-item');
  on(copy, 'click', async () => { try { await navigator.clipboard.writeText(location.href); announce('Post link copied.'); } catch { announce('Link ready to copy from your browser.'); } closeDialog(); });
  on(report, 'click', () => { closeDialog(); announce('Thanks. We will review this post.'); });
  on(mute, 'click', () => { closeDialog(); announce('You will see fewer posts from this account.'); });
  menu.append(report, copy, mute);
  openDialog('Post options', menu, 'Manage');
}

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
  button.animate?.([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 300 });
}

function handleSave(button) {
  const post = button.closest('.post-card');
  const postId = getPostId(post);
  const saved = button.classList.toggle('saved');
  button.setAttribute('aria-pressed', String(saved));
  const icon = $('i', button);
  icon?.classList.toggle('fa-regular', !saved);
  icon?.classList.toggle('fa-solid', saved);
  state.savedPosts = saved ? [...new Set([...state.savedPosts, postId])] : state.savedPosts.filter((id) => id !== postId);
  saveState();
  announce(saved ? 'Saved to your collection.' : 'Removed from saved.');
}

function handleShare(post) {
  const username = $('.username', post)?.textContent?.trim() || 'this post';
  const body = document.createElement('div');
  body.className = 'share-panel';
  body.innerHTML = `<p>Share <strong>${escapeHtml(username)}</strong> with someone who would love it.</p><div class="share-options"><button type="button" data-share="copy"><i class="fa-solid fa-link"></i> Copy link</button><button type="button" data-share="message"><i class="fa-regular fa-paper-plane"></i> Send in chat</button></div>`;
  $$('.share-options button', body).forEach((option) => on(option, 'click', () => { closeDialog(); announce(option.dataset.share === 'copy' ? 'Post link copied.' : 'Opening a new message.'); }));
  openDialog('Share post', body, 'Pass it on');
}

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
  let objectUrl = null;
  const open = () => { modal?.classList.add('active'); document.body.classList.add('dialog-open'); $('.close-modal', modal)?.focus(); };
  const reset = () => { if (!modal) return; area.style.display = 'flex'; previewArea.style.display = 'none'; preview.removeAttribute('src'); input.value = ''; $('#captionInput').value = ''; $('#locationInput').value = ''; if (objectUrl) URL.revokeObjectURL(objectUrl); objectUrl = null; };
  const closeModal = () => { modal?.classList.remove('active'); document.body.classList.remove('dialog-open'); reset(); };
  window.openUploadModal = open;
  on(uploadBtn, 'click', open); on(close, 'click', closeModal); on(cancel, 'click', closeModal); on(modal, 'click', (event) => { if (event.target === modal) closeModal(); }); on(select, 'click', () => input.click());
  const previewFile = (file) => { if (!file?.type.startsWith('image/')) { announce('Please choose an image file.', 'error'); return; } if (file.size > MAX_IMAGE_SIZE) { announce('Images must be smaller than 10 MB.', 'error'); return; } const reader = new FileReader(); reader.onload = () => { preview.src = reader.result; area.style.display = 'none'; previewArea.style.display = 'grid'; }; reader.onerror = () => announce('That image could not be read. Try another file.', 'error'); reader.readAsDataURL(file); };
  on(input, 'change', () => previewFile(input.files?.[0])); on(area, 'dragover', (event) => { event.preventDefault(); area.classList.add('drag-over'); }); on(area, 'dragleave', () => area.classList.remove('drag-over')); on(area, 'drop', (event) => { event.preventDefault(); area.classList.remove('drag-over'); previewFile(event.dataTransfer.files?.[0]); });
  on($('#shareBtn'), 'click', () => { if (!preview.src) { announce('Choose a photo before sharing.', 'error'); return; } const caption = $('#captionInput').value.trim(); const location = $('#locationInput').value.trim(); createNewPost({ caption, location, imageSrc: preview.src, username: 'mike.photos' }); closeModal(); announce('Your moment is live.'); });
}

function createNewPost({ id = `local-${Date.now()}`, caption, location, imageSrc, username, createdAt = new Date().toISOString() }, persist = true) {
  const feed = $('.feed-section'); if (!feed) return;
  const post = document.createElement('article'); post.className = 'post-card new-post'; post.dataset.postId = id;
  post.innerHTML = `<div class="post-header"><div class="user-info"><img src="https://i.pravatar.cc/150?img=10" alt="Mike Anderson" class="user-avatar"><div class="user-details"><span class="username">${escapeHtml(username)}</span><span class="location">${escapeHtml(location || 'Shared just now')}</span></div></div><button class="post-options" aria-label="More options"><i class="fa-solid fa-ellipsis"></i></button></div><div class="post-image"><img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(caption || 'New photo shared by Mike')}"></div><div class="post-actions"><div class="action-buttons"><button class="action-btn like-btn" aria-label="Like post" aria-pressed="false"><i class="fa-regular fa-heart"></i></button><button class="action-btn" aria-label="Comment"><i class="fa-regular fa-comment"></i></button><button class="action-btn" aria-label="Share"><i class="fa-regular fa-paper-plane"></i></button></div><button class="action-btn save-btn" aria-label="Save post" aria-pressed="false"><i class="fa-regular fa-bookmark"></i></button></div><div class="post-info"><div class="likes-count"><strong>0 likes</strong></div><div class="post-caption"><strong>${escapeHtml(username)}</strong> ${escapeHtml(caption || 'A new moment from my camera roll.')}</div><button class="view-comments">View all 0 comments</button><div class="post-time">${persist ? 'JUST NOW' : 'SHARED EARLIER'}</div></div>`;
  feed.prepend(post);
  state.postStats[id] = state.postStats[id] || { likes: 0, comments: [], commentCount: 0 };
  updatePostCounts(post, state.postStats[id]);
  if (persist) { state.posts = [{ id, caption, location, imageSrc, username, createdAt }, ...state.posts.filter((item) => item.id !== id)]; saveState(); post.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}

function hydratePosts() {
  [...state.posts].reverse().forEach((post) => createNewPost(post, false));
}

function handleFollow(button) { const item = button.closest('.suggestion-item'); const username = $('.suggestion-username', item)?.textContent || 'creator'; const following = button.classList.toggle('following'); button.textContent = following ? 'Following' : 'Follow'; state.followedUsers = following ? [...new Set([...state.followedUsers, username])] : state.followedUsers.filter((name) => name !== username); saveState(); announce(following ? `Following ${username}.` : `Unfollowed ${username}.`); }

function setupSearch() { const input = $('.search-bar input'); if (!input) return; on(input, 'keydown', (event) => { if (event.key !== 'Enter') return; const query = input.value.trim().toLowerCase(); if (!query) return announce('Try searching for a person, place, or moment.'); const matches = $$('[data-searchable], .post-card, .suggestion-item').filter((item) => item.textContent.toLowerCase().includes(query)); announce(matches.length ? `${matches.length} result${matches.length === 1 ? '' : 's'} for “${query}”.` : `No results for “${query}”.`, matches.length ? 'default' : 'error'); matches[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }); }

function setupProfilePage() {
  const edit = $('.button-outline'); if (edit) on(edit, 'click', () => { const body = document.createElement('form'); body.className = 'edit-form'; body.innerHTML = '<label>Display name<input name="name" maxlength="40"></label><label>Bio<textarea name="bio" maxlength="160"></textarea></label><button class="dialog-action" type="submit">Save changes</button>'; $('input', body).value = state.profile.name; $('textarea', body).value = state.profile.bio; on(body, 'submit', (event) => { event.preventDefault(); state.profile.name = $('input', body).value.trim() || state.profile.name; state.profile.bio = $('textarea', body).value.trim() || state.profile.bio; saveState(); applyProfile(); closeDialog(); announce('Profile updated.'); }); openDialog('Edit profile', body, 'Your profile'); });
  $$('.profile-tabs button').forEach((tab, index) => on(tab, 'click', () => { $$('.profile-tabs button').forEach((item) => item.classList.remove('active')); tab.classList.add('active'); const grid = $('.profile-grid'); if (index === 1) { grid.classList.add('saved-view'); announce('Saved posts selected.'); } else { grid.classList.remove('saved-view'); announce('Your posts selected.'); } })); hydrateProfilePosts(); applyProfile();
}
function applyProfile() { const title = $('.profile-title-row h1'); const bio = $('.profile-bio'); if (title) title.firstChild.textContent = 'mike.photos '; if (bio) bio.innerHTML = escapeHtml(state.profile.bio).replace(/\n/g, '<br>'); }

function hydrateProfilePosts() {
  const grid = $('.profile-grid');
  if (!grid) return;
  $$('.user-post-tile', grid).forEach((tile) => tile.remove());
  [...state.posts].forEach((post) => {
    const tile = document.createElement('img');
    tile.className = 'user-post-tile';
    tile.src = post.imageSrc;
    tile.alt = post.caption || 'Photo shared by Mike';
    tile.dataset.postId = post.id;
    grid.prepend(tile);
  });
  const postCount = $('.profile-stats strong');
  if (postCount) postCount.textContent = String(24 + state.posts.length);
}

function restoreState() { $$('.post-card').forEach((post) => { const id = getPostId(post); const stats = getPostStats(post); const like = $('.like-btn', post); const save = $('.save-btn', post); updatePostCounts(post, stats); if (state.likedPosts.includes(id)) { like?.classList.add('liked'); like?.setAttribute('aria-pressed', 'true'); $('i', like)?.classList.replace('fa-regular', 'fa-solid'); } if (state.savedPosts.includes(id)) { save?.classList.add('saved'); save?.setAttribute('aria-pressed', 'true'); $('i', save)?.classList.replace('fa-regular', 'fa-solid'); } }); $$('.follow-btn').forEach((button) => { const username = $('.suggestion-username', button.closest('.suggestion-item'))?.textContent; if (state.followedUsers.includes(username)) { button.classList.add('following'); button.textContent = 'Following'; } }); saveState(); }

function setupEvents() { setupUpload(); setupSearch(); setupProfilePage(); hydratePosts(); restoreState(); const filter = $('.feed-filter'); if (filter) filter.innerHTML = `${state.feed} <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>`; on(filter, 'click', (event) => showFeedMenu(event.currentTarget)); on($('.stories-heading button'), 'click', () => { $('.stories-container')?.scrollTo({ left: $('.stories-container').scrollWidth, behavior: 'smooth' }); announce('Showing the latest stories.'); }); on($('.see-all'), 'click', () => announce('You are seeing all suggested creators.')); on($('.nav-icons button[title="Notifications"]'), 'click', showNotifications); document.addEventListener('click', (event) => { const target = event.target.closest('button'); if (!target) return; const post = target.closest('.post-card'); if (target.matches('.like-btn')) return handleLike(target); if (target.matches('.save-btn')) return handleSave(target); if (target.matches('.view-comments, .action-btn[aria-label="Comment"]')) return showComments(post); if (target.matches('.action-btn[aria-label="Share"]')) return handleShare(post); if (target.matches('.post-options')) return showPostMenu(post); if (target.matches('.story-item')) return showStory(target); if (target.matches('.follow-btn')) return handleFollow(target); }); }

on(document, 'keydown', (event) => { if (event.key === 'Escape') { closeDialog(); } });
setupEvents();

/**
 * Mikesta — Professional-Grade Client Application Engine
 * Advanced Systems:
 * - State persistence with offline PWA service worker
 * - Multi-image swipe/touch photo carousels
 * - Procedural Ambient Soundscape ("Circle Radio") with Web Audio oscillators & vinyl tape crackle
 * - Multi-vibe themes & Command Palette (Cmd+K / ?)
 * - Immersive stories viewer & dedicated Story Studio creator
 * - Camera EXIF inspector & Creator profile sheets
 * - Direct Messages (DM) with simulated contextual replies
 * - Floating emoji reaction docks & double-tap heart bursts
 * - Interactive World Moments map & Stacks moodboards
 * - Subtle 3D gyro/mouse parallax card tilt
 */

// Core DOM helpers
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const on = (element, event, handler, options) => element?.addEventListener(event, handler, options);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const STORAGE_KEY = 'mikesta-state-v5';
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
      reaction: '❤️',
      comments: [
        { username: 'ava.studio', text: 'This morning light is unreal.' },
        { username: 'sam.builds', text: 'Rockaway is magic at this hour.' }
      ]
    },
    'post-2': {
      likes: 856,
      commentCount: 23,
      reaction: '❤️',
      comments: [
        { username: 'travel.adventures', text: 'Alfama neighborhood has the best secret stairs.' },
        { username: 'priya.makes', text: 'Adding this to my wanderlust list!' }
      ]
    },
    'post-3': {
      likes: 642,
      commentCount: 18,
      reaction: '❤️',
      comments: [
        { username: 'mike.photos', text: 'Love the stillness in this frame.' },
        { username: 'nora.eats', text: 'The natural clay tones are so calming.' }
      ]
    },
    'post-4': {
      likes: 1049,
      commentCount: 31,
      reaction: '❤️',
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
  ambientRadioPlaying: false,
  unreadNotifications: 3,
  unreadMessages: 1,
  myStory: null,
  chatMessages: {
    'ava.studio': [
      { sender: 'them', text: 'That Rockaway photo is unreal! What lens did you shoot it on?', time: '10:42 AM' },
      { sender: 'me', text: 'Thanks Ava! Shot it on the 35mm Summilux right before the day got loud.', time: '10:45 AM' },
      { sender: 'them', text: 'The subtle blue gradient is perfection. Let me know if you swing by Greenpoint this weekend!', time: '10:48 AM' }
    ],
    'sam.builds': [
      { sender: 'them', text: 'Working on a new timber desk setup today, stop by anytime for espresso.', time: 'Yesterday' }
    ],
    'maya.moves': [
      { sender: 'them', text: 'Caught sunrise over the Hudson Valley ridge line today ✨', time: 'Yesterday' }
    ]
  },
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
      chatMessages: stored.chatMessages || defaultState.chatMessages,
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
   Tactile Web Audio Synthesizer & Procedural Ambient Soundscape
   ========================================================================== */
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ambientNodes = null;
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
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(820, now + 0.08);
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
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(1080, now + 0.12);
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

  chime() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [660, 880].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + (i * 0.08));
        gain.gain.setValueAtTime(0.1, now + (i * 0.08));
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.08) + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + (i * 0.08));
        osc.stop(now + (i * 0.08) + 0.15);
      });
    } catch {}
  }

  // Procedural warm lofi vinyl drone soundscape
  toggleAmbientRadio() {
    this.init();
    if (!this.ctx) return;

    if (this.ambientNodes) {
      // Stop ambient sound
      try {
        this.ambientNodes.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
        setTimeout(() => {
          this.ambientNodes.oscillators.forEach((o) => { try { o.stop(); } catch {} });
          this.ambientNodes = null;
        }, 500);
      } catch {}
      state.ambientRadioPlaying = false;
      saveState();
      updateAmbientRadioUI(false);
      announce('Circle Radio paused.');
    } else {
      // Start ambient chord drone + subtle tape texture
      try {
        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        masterGain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 1.2);
        masterGain.connect(this.ctx.destination);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, this.ctx.currentTime);
        filter.connect(masterGain);

        // F# Major 7th ambient chord (F#2, C#3, F3, A#3)
        const chordFrequencies = [92.5, 138.59, 174.61, 233.08];
        const oscillators = chordFrequencies.map((freq, i) => {
          const osc = this.ctx.createOscillator();
          osc.type = i % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          osc.detune.setValueAtTime((Math.random() * 8) - 4, this.ctx.currentTime);
          osc.connect(filter);
          osc.start();
          return osc;
        });

        this.ambientNodes = { masterGain, filter, oscillators };
        state.ambientRadioPlaying = true;
        saveState();
        updateAmbientRadioUI(true);
        announce('Now Playing: Ambient Circle Radio ✨', 'success');
      } catch (e) {
        console.error(e);
      }
    }
  }
}

const sounds = new AudioEngine();

function updateAmbientRadioUI(isPlaying) {
  const btn = $('#ambientRadioBtn');
  if (!btn) return;
  btn.classList.toggle('playing', isPlaying);
  const text = $('.ambient-radio-label', btn);
  if (text) text.textContent = isPlaying ? 'Circle Radio · Live' : 'Circle Radio';
}

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

function cycleTheme() {
  const currentIdx = THEMES.findIndex((t) => t.id === state.theme);
  const nextIdx = (currentIdx + 1) % THEMES.length;
  const next = THEMES[nextIdx];
  applyTheme(next.id);
  announce(`Vibe set to ${next.label}.`, 'success');
  sounds.pop();
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
  openDialog('Choose your aesthetic vibe', menu, 'Aesthetic');
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
   Multi-Image Carousel Engine
   ========================================================================== */
function setupCarousels() {
  $$('.carousel-container').forEach((container) => {
    if (container.dataset.carouselInit) return;
    container.dataset.carouselInit = 'true';

    const track = $('.carousel-track', container);
    const slides = $$('.carousel-slide', container);
    const dots = $$('.carousel-dot', container);
    const counter = $('.carousel-counter', container);
    const prevBtn = $('.carousel-arrow.prev', container);
    const nextBtn = $('.carousel-arrow.next', container);
    let currentIndex = 0;

    const updateSlide = (newIndex) => {
      currentIndex = Math.max(0, Math.min(newIndex, slides.length - 1));
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
      if (counter) counter.textContent = `${currentIndex + 1}/${slides.length}`;
      if (prevBtn) prevBtn.style.display = currentIndex === 0 ? 'none' : 'grid';
      if (nextBtn) nextBtn.style.display = currentIndex === slides.length - 1 ? 'none' : 'grid';
    };

    on(prevBtn, 'click', (e) => {
      e.stopPropagation();
      updateSlide(currentIndex - 1);
      sounds.pop();
    });

    on(nextBtn, 'click', (e) => {
      e.stopPropagation();
      updateSlide(currentIndex + 1);
      sounds.pop();
    });

    dots.forEach((dot, i) => {
      on(dot, 'click', (e) => {
        e.stopPropagation();
        updateSlide(i);
        sounds.pop();
      });
    });

    // Touch swipe gestures
    let touchStartX = 0;
    on(container, 'touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    on(container, 'touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      if (diff > 45) updateSlide(currentIndex + 1);
      if (diff < -45) updateSlide(currentIndex - 1);
    });

    updateSlide(0);
  });
}

/* ==========================================================================
   3D Card Parallax Tilt (Subtle tactile physics)
   ========================================================================== */
function setupCardTilt() {
  if (window.matchMedia('(hover: hover)').matches) {
    $$('.post-card').forEach((card) => {
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = 'true';

      on(card, 'mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -1.8;
        const rotateY = ((x - centerX) / centerX) * 1.8;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      on(card, 'mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      });
    });
  }
}

/* ==========================================================================
   Camera EXIF Metadata Registry
   ========================================================================== */
const POST_EXIF = {
  'post-1': {
    camera: 'Leica M11',
    lens: 'Summilux-M 35mm f/1.4 ASPH',
    shutter: '1/500s',
    aperture: 'f/2.8',
    iso: 'ISO 200',
    profile: 'Leica Warm Classic',
    light: 'Golden Hour (30m before dusk)'
  },
  'post-2': {
    camera: 'Fujifilm X100V',
    lens: 'Fujinon 23mm f/2.0 Fixed',
    shutter: '1/250s',
    aperture: 'f/4.0',
    iso: 'ISO 160',
    profile: 'Classic Negative Recipe',
    light: 'Afternoon Sun over Lisbon'
  },
  'post-3': {
    camera: 'Hasselblad 907X',
    lens: 'XCD 45mm f/4 P',
    shutter: '1/125s',
    aperture: 'f/2.8',
    iso: 'ISO 400',
    profile: 'Natural Ceramic Warmth',
    light: 'Diffused Morning Studio North Light'
  },
  'post-4': {
    camera: 'Sony A7 IV',
    lens: 'FE 24-70mm f/2.8 GM II',
    shutter: '1/320s',
    aperture: 'f/2.8',
    iso: 'ISO 100',
    profile: 'Natural Forest Standard',
    light: 'Filtered Sunlight through Redwoods'
  }
};

function showExifDetails(postId) {
  const exif = POST_EXIF[postId] || {
    camera: '35mm Film Camera',
    lens: 'Prime 40mm Lens',
    shutter: '1/250s',
    aperture: 'f/2.8',
    iso: 'ISO 200',
    profile: 'Mikesta Analog Filter',
    light: 'Natural Ambient'
  };

  const body = document.createElement('div');
  body.className = 'exif-popover';
  body.innerHTML = `
    <div class="exif-row"><span class="exif-label">Camera</span><span class="exif-val">${escapeHtml(exif.camera)}</span></div>
    <div class="exif-row"><span class="exif-label">Lens</span><span class="exif-val">${escapeHtml(exif.lens)}</span></div>
    <div class="exif-row"><span class="exif-label">Exposure</span><span class="exif-val">${exif.shutter} · ${exif.aperture} · ${exif.iso}</span></div>
    <div class="exif-row"><span class="exif-label">Atmosphere</span><span class="exif-val">${escapeHtml(exif.profile)}</span></div>
    <div class="exif-row"><span class="exif-label">Lighting</span><span class="exif-val">${escapeHtml(exif.light)}</span></div>
  `;
  openDialog('Exposure & Camera Details', body, 'EXIF Data');
  sounds.pop();
}

/* ==========================================================================
   Creator Directory & Creator Profile Modal
   ========================================================================== */
const CREATORS_DATA = {
  'ava.studio': {
    name: 'Ava Lin',
    avatar: 'https://i.pravatar.cc/150?img=1',
    bio: 'Architectural ceramicist & visual collector in Greenpoint, Brooklyn. Investigating quiet forms, tactile earthenware, and soft shadow studies.',
    location: 'Brooklyn, NY',
    followers: '3.4k',
    following: '412',
    moments: 38,
    photos: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=600&q=80'
    ]
  },
  'travel.adventures': {
    name: 'Elena Rostova',
    avatar: 'https://i.pravatar.cc/150?img=8',
    bio: 'Slow traveler and documentary photographer. Tracking cobblestone alleyways, terracotta facades, and yellow trams across Southern Europe.',
    location: 'Lisbon, Portugal',
    followers: '5.1k',
    following: '389',
    moments: 52,
    photos: [
      'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'
    ]
  },
  'sam.builds': {
    name: 'Samir Patel',
    avatar: 'https://i.pravatar.cc/150?img=5',
    bio: 'Systems engineer & studio builder in Manhattan. Focused on warm timber furniture, ambient lighting, and quiet software.',
    location: 'New York, NY',
    followers: '2.8k',
    following: '254',
    moments: 29,
    photos: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'
    ]
  },
  'maya.moves': {
    name: 'Maya Santos',
    avatar: 'https://i.pravatar.cc/150?img=2',
    bio: 'Dancer, movement researcher, and dawn patrol chaser in Hudson Valley. Catching early light as it cuts through morning fog.',
    location: 'Hudson Valley, NY',
    followers: '4.2k',
    following: '310',
    moments: 44,
    photos: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'
    ]
  },
  'nora.eats': {
    name: 'Nora Vance',
    avatar: 'https://i.pravatar.cc/150?img=4',
    bio: 'Artisan baker & cookbook writer. Celebrating slow fermentation, heritage wheat, and kitchen sunlight.',
    location: 'Portland, OR',
    followers: '3.9k',
    following: '290',
    moments: 35,
    photos: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=600&q=80'
    ]
  },
  'priya.makes': {
    name: 'Priya Shah',
    avatar: 'https://i.pravatar.cc/100?img=13',
    bio: 'Collector of mid-century chairs, tactile book covers, and coastal morning light.',
    location: 'San Francisco, CA',
    followers: '1.9k',
    following: '180',
    moments: 21,
    photos: [
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=600&q=80'
    ]
  }
};

function showCreatorProfile(username) {
  if (username === 'mike.photos') {
    window.location.href = 'profile.html';
    return;
  }
  const creator = CREATORS_DATA[username];
  if (!creator) return;

  const isFollowing = state.followedUsers.includes(username);

  let modal = $('#creatorModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'creatorModal';
    modal.className = 'creator-sheet-modal';
    modal.setAttribute('role', 'dialog');
    document.body.appendChild(modal);
    on(modal, 'click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  modal.innerHTML = `
    <div class="creator-card">
      <div class="creator-header">
        <img src="${creator.avatar}" alt="${escapeHtml(creator.name)}" class="creator-avatar-large">
        <div class="creator-header-info">
          <h3>${escapeHtml(creator.name)} <i class="fa-solid fa-circle-check verified"></i></h3>
          <span style="font-family: 'DM Mono', monospace; font-size: 11px; color: var(--muted);">${escapeHtml(username)} · ${escapeHtml(creator.location)}</span>
          <div class="creator-stats-bar">
            <span><strong>${creator.moments}</strong> moments</span>
            <span><strong>${creator.followers}</strong> circle</span>
            <span><strong>${creator.following}</strong> following</span>
          </div>
        </div>
      </div>
      <div class="creator-bio-box">
        <p style="margin: 0;">${escapeHtml(creator.bio)}</p>
      </div>
      <div class="creator-actions-row">
        <button type="button" class="dialog-action follow-creator-btn" style="flex: 1; ${isFollowing ? 'background: var(--line); color: var(--ink);' : ''}">
          ${isFollowing ? 'Following' : 'Follow circle'}
        </button>
        <button type="button" class="button-outline message-creator-btn" style="flex: 1;">
          <i class="fa-regular fa-paper-plane"></i> Send message
        </button>
      </div>
      <div class="creator-grid">
        ${creator.photos.map((src) => `<img src="${src}" alt="Moment by ${escapeHtml(username)}">`).join('')}
      </div>
    </div>
  `;

  modal.classList.add('active');
  sounds.pop();

  const followBtn = $('.follow-creator-btn', modal);
  on(followBtn, 'click', () => {
    const following = state.followedUsers.includes(username);
    if (following) {
      state.followedUsers = state.followedUsers.filter((u) => u !== username);
      followBtn.textContent = 'Follow circle';
      followBtn.style.background = 'var(--accent)';
      followBtn.style.color = '#ffffff';
      announce(`Unfollowed ${username}.`);
    } else {
      state.followedUsers.push(username);
      followBtn.textContent = 'Following';
      followBtn.style.background = 'var(--line)';
      followBtn.style.color = 'var(--ink)';
      announce(`Following ${username}.`, 'success');
    }
    saveState();
    sounds.pop();

    $$('.suggestion-item').forEach((item) => {
      if ($('.suggestion-username', item)?.textContent === username) {
        const btn = $('.follow-btn', item);
        btn.classList.toggle('following', !following);
        btn.textContent = !following ? 'Following' : 'Follow';
      }
    });
  });

  const msgBtn = $('.message-creator-btn', modal);
  on(msgBtn, 'click', () => {
    modal.classList.remove('active');
    openChatWithUser(username);
  });

  $$('.creator-grid img', modal).forEach((img) => {
    on(img, 'click', () => {
      openLightbox({
        image: img.src,
        username: username,
        avatar: creator.avatar,
        location: creator.location,
        caption: 'Captured moment on Mikesta.'
      });
    });
  });
}

/* ==========================================================================
   Direct Messages (Chat) Drawer
   ========================================================================== */
let activeChatUser = null;

function ensureChatDrawer() {
  let drawer = $('#chatDrawer');
  let overlay = $('#chatOverlay');
  if (drawer && overlay) return { drawer, overlay };

  overlay = document.createElement('div');
  overlay.id = 'chatOverlay';
  overlay.className = 'chat-overlay';
  document.body.appendChild(overlay);

  drawer = document.createElement('div');
  drawer.id = 'chatDrawer';
  drawer.className = 'chat-drawer';
  drawer.innerHTML = `
    <!-- Threads List View -->
    <div class="chat-threads-view" id="chatThreadsView" style="display: flex; flex-direction: column; height: 100%;">
      <div class="chat-header">
        <h3>Direct Messages</h3>
        <button class="dialog-close" id="closeChatBtn" aria-label="Close messages"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="chat-thread-list" id="chatThreadsList"></div>
    </div>

    <!-- Active Conversation View -->
    <div class="chat-conversation-view" id="chatConvoView">
      <div class="chat-convo-header">
        <button class="chat-back-btn" id="chatBackBtn" aria-label="Back"><i class="fa-solid fa-arrow-left"></i></button>
        <img src="" id="chatConvoAvatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
        <div>
          <span id="chatConvoName" style="font-size: 13px; font-weight: 800; display: block;"></span>
          <span style="font-size: 10px; color: #2a8f68;">● Active now</span>
        </div>
      </div>
      <div class="chat-messages-container" id="chatMessages"></div>
      <form class="chat-input-bar" id="chatForm">
        <input type="text" id="chatInput" placeholder="Write a thoughtful note..." maxlength="240" autocomplete="off">
        <button type="submit" class="chat-send-btn"><i class="fa-solid fa-arrow-up"></i></button>
      </form>
    </div>
  `;
  document.body.appendChild(drawer);

  on($('#closeChatBtn', drawer), 'click', closeChat);
  on(overlay, 'click', closeChat);

  on($('#chatBackBtn', drawer), 'click', () => {
    $('#chatConvoView', drawer).classList.remove('active');
    $('#chatThreadsView', drawer).style.display = 'flex';
    renderChatThreads();
  });

  on($('#chatForm', drawer), 'submit', (e) => {
    e.preventDefault();
    const input = $('#chatInput', drawer);
    const text = input.value.trim();
    if (!text || !activeChatUser) return;

    state.chatMessages[activeChatUser] = state.chatMessages[activeChatUser] || [];
    state.chatMessages[activeChatUser].push({ sender: 'me', text, time: 'Just now' });
    saveState();
    renderConversationMessages(activeChatUser);
    input.value = '';
    sounds.pop();

    setTimeout(() => {
      const replies = {
        'ava.studio': [
          'Love this thought! Next time you are in Brooklyn let’s definitely meet for coffee at Sey.',
          'Totally agree. The texture in that photo was unreal.',
          'Working on firing a new batch of stoneware today!'
        ],
        'sam.builds': [
          'Agreed! Catching up soon.',
          'Just finished routing the desk cables, looks so clean now.'
        ],
        'maya.moves': [
          'Yes! The mist this morning was unbelievable.',
          'Heading out for another shoot tomorrow dawn.'
        ]
      };
      const possible = replies[activeChatUser] || ['Thanks for sharing this moment with me! ✨'];
      const replyText = possible[Math.floor(Math.random() * possible.length)];

      state.chatMessages[activeChatUser].push({ sender: 'them', text: replyText, time: 'Just now' });
      saveState();
      if ($('#chatConvoView').classList.contains('active')) {
        renderConversationMessages(activeChatUser);
      }
      sounds.chime();
    }, 1400);
  });

  return { drawer, overlay };
}

function openChat() {
  const { drawer, overlay } = ensureChatDrawer();
  const badge = $('#chatBadge');
  if (badge) badge.style.display = 'none';
  state.unreadMessages = 0;
  saveState();

  renderChatThreads();
  $('#chatThreadsView', drawer).style.display = 'flex';
  $('#chatConvoView', drawer).classList.remove('active');

  overlay.classList.add('open');
  drawer.classList.add('open');
  sounds.pop();
}

function openChatWithUser(username) {
  const { drawer, overlay } = ensureChatDrawer();
  overlay.classList.add('open');
  drawer.classList.add('open');
  activeChatUser = username;

  const creator = CREATORS_DATA[username] || { name: username, avatar: 'https://i.pravatar.cc/150?img=7' };
  $('#chatConvoAvatar', drawer).src = creator.avatar;
  $('#chatConvoName', drawer).textContent = creator.name;

  $('#chatThreadsView', drawer).style.display = 'none';
  $('#chatConvoView', drawer).classList.add('active');

  renderConversationMessages(username);
  $('#chatInput', drawer).focus();
  sounds.pop();
}

function closeChat() {
  $('#chatDrawer')?.classList.remove('open');
  $('#chatOverlay')?.classList.remove('open');
}

function renderChatThreads() {
  const list = $('#chatThreadsList');
  if (!list) return;

  const threads = Object.keys(state.chatMessages);
  list.innerHTML = threads.map((user) => {
    const creator = CREATORS_DATA[user] || { name: user, avatar: 'https://i.pravatar.cc/150?img=1' };
    const msgs = state.chatMessages[user] || [];
    const lastMsg = msgs[msgs.length - 1] || { text: 'Start a conversation', time: '' };

    return `
      <div class="chat-thread-item" data-user="${escapeHtml(user)}">
        <img src="${creator.avatar}" alt="${escapeHtml(creator.name)}" class="chat-thread-avatar">
        <div class="chat-thread-content">
          <div class="chat-thread-top">
            <span class="chat-thread-name">${escapeHtml(creator.name)}</span>
            <span class="chat-thread-time">${escapeHtml(lastMsg.time)}</span>
          </div>
          <p class="chat-thread-snippet">${escapeHtml(lastMsg.text)}</p>
        </div>
      </div>
    `;
  }).join('');

  $$('.chat-thread-item', list).forEach((item) => {
    on(item, 'click', () => {
      openChatWithUser(item.dataset.user);
    });
  });
}

function renderConversationMessages(username) {
  const container = $('#chatMessages');
  if (!container) return;

  const msgs = state.chatMessages[username] || [];
  container.innerHTML = msgs.map((m) => `
    <div class="chat-bubble ${m.sender === 'me' ? 'outgoing' : 'incoming'}">
      ${escapeHtml(m.text)}
    </div>
  `).join('');
  container.scrollTop = container.scrollHeight;
}

/* ==========================================================================
   Story Creator Studio (Dedicated Add-to-Story Flow)
   ========================================================================== */
const STORY_GRADIENTS = [
  'linear-gradient(135deg, #f1d879, #e76f51)',
  'linear-gradient(135deg, #3a1c71, #d76d77, #ffaf7b)',
  'linear-gradient(135deg, #134e5e, #71b280)',
  'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  'linear-gradient(135deg, #ff758c, #ff7eb3)'
];

const STORY_STICKERS = [
  '📍 New York, NY',
  '☕️ 8:15 AM',
  '✨ Current mood',
  '🎧 Boards of Canada',
  '🎞 35mm Portra'
];

let currentStoryGradient = STORY_GRADIENTS[0];
let currentStorySticker = STORY_STICKERS[0];

function openStoryCreator() {
  let modal = $('#storyCreatorModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'storyCreatorModal';
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.innerHTML = `
      <div class="story-creator-card">
        <div class="story-creator-preview" id="storyPreviewBox">
          <span class="story-creator-text" id="storyPreviewText">Sharing a quiet moment...</span>
          <span class="story-creator-sticker" id="storyPreviewSticker">${STORY_STICKERS[0]}</span>
        </div>
        <div class="story-creator-controls">
          <input type="text" id="storyTextInput" placeholder="Add text to your story..." maxlength="80" style="padding: 10px; border: 1px solid var(--line); border-radius: var(--radius-sm); font-size: 13px;">
          <div>
            <span class="kicker" style="font-size: 9px;">Atmospheric Gradient</span>
            <div class="gradient-options" id="storyGradientList"></div>
          </div>
          <div>
            <span class="kicker" style="font-size: 9px;">Story Sticker</span>
            <div class="sticker-options" id="storyStickerList"></div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px;">
            <button type="button" class="cancel-btn" id="closeStoryCreator">Cancel</button>
            <button type="button" class="dialog-action" id="publishStoryBtn">Share to your story ✨</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    on($('#closeStoryCreator', modal), 'click', () => {
      modal.classList.remove('active');
      document.body.classList.remove('dialog-open');
    });

    on($('#storyTextInput', modal), 'input', (e) => {
      const val = e.target.value.trim() || 'Sharing a quiet moment...';
      $('#storyPreviewText', modal).textContent = val;
    });

    const gradList = $('#storyGradientList', modal);
    gradList.innerHTML = STORY_GRADIENTS.map((g, i) => `
      <button type="button" class="gradient-dot ${i === 0 ? 'active' : ''}" style="background: ${g};" data-grad="${g}"></button>
    `).join('');
    $$('.gradient-dot', gradList).forEach((dot) => {
      on(dot, 'click', () => {
        $$('.gradient-dot', gradList).forEach((d) => d.classList.remove('active'));
        dot.classList.add('active');
        currentStoryGradient = dot.dataset.grad;
        $('#storyPreviewBox', modal).style.background = currentStoryGradient;
        sounds.pop();
      });
    });

    const stickList = $('#storyStickerList', modal);
    stickList.innerHTML = STORY_STICKERS.map((s, i) => `
      <button type="button" class="sticker-chip ${i === 0 ? 'active' : ''}" data-sticker="${escapeHtml(s)}">${escapeHtml(s)}</button>
    `).join('');
    $$('.sticker-chip', stickList).forEach((chip) => {
      on(chip, 'click', () => {
        $$('.sticker-chip', stickList).forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        currentStorySticker = chip.dataset.sticker;
        $('#storyPreviewSticker', modal).textContent = currentStorySticker;
        sounds.pop();
      });
    });

    on($('#publishStoryBtn', modal), 'click', () => {
      const captionText = $('#storyTextInput', modal).value.trim() || 'A small moment worth keeping.';
      state.myStory = {
        id: 'story-mike',
        username: 'mike.photos',
        avatar: state.profile.avatar,
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85',
        time: 'Just now',
        location: currentStorySticker,
        caption: captionText
      };
      saveState();

      const myStoryItem = $('.story-item.story-add');
      if (myStoryItem) {
        myStoryItem.classList.remove('story-add');
        const badge = $('b', myStoryItem);
        if (badge) badge.style.display = 'none';
      }

      modal.classList.remove('active');
      document.body.classList.remove('dialog-open');
      sounds.reaction();
      announce('Added to your story ✨', 'success');
    });
  }

  modal.classList.add('active');
  document.body.classList.add('dialog-open');
  sounds.pop();
}

/* ==========================================================================
   Command Palette & Keyboard Shortcuts
   ========================================================================== */
const COMMANDS = [
  { key: 'N', label: 'Create new post', action: () => window.openUploadModal?.() },
  { key: 'Z', label: 'Toggle Zen Reading Mode', action: () => toggleZenMode() },
  { key: 'W', label: 'Explore World Moments Map', action: () => openWorldMap() },
  { key: 'E', label: 'Export fine art postcard', action: () => { const p = $('.post-card'); openPostcardExport(p ? getPostId(p) : 'post-1'); } },
  { key: 'C', label: 'Camera shutter snapshot', action: () => triggerShutterFlash() },
  { key: 'G', label: 'Toggle analog film grain texture', action: () => toggleGrain() },
  { key: 'D', label: 'Open Direct Messages', action: () => openChat() },
  { key: 'R', label: 'Toggle Circle Radio', action: () => sounds.toggleAmbientRadio() },
  { key: 'T', label: 'Cycle aesthetic vibe (theme)', action: () => cycleTheme() },
  { key: 'M', label: 'Toggle sound effects', action: () => toggleSound() },
  { key: '?', label: 'Show visual shortcuts guide', action: () => openKeyboardGuide() },
  { key: 'P', label: 'Go to your profile', action: () => window.location.href = 'profile.html' },
  { key: 'H', label: 'Go to home feed', action: () => window.location.href = 'index.html' },
  { key: 'S', label: 'Create new story', action: () => openStoryCreator() },
  { key: '1', label: 'Filter: #coast', action: () => filterFeedByTag('coast') },
  { key: '2', label: 'Filter: #architecture', action: () => filterFeedByTag('architecture') },
  { key: '3', label: 'Filter: #nature', action: () => filterFeedByTag('nature') }
];

function toggleCommandPalette() {
  let backdrop = $('#commandPaletteBackdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'commandPaletteBackdrop';
    backdrop.className = 'command-palette-backdrop';
    backdrop.innerHTML = `
      <div class="command-palette">
        <div class="command-input-row">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="commandSearch" placeholder="Type a command or shortcut (e.g. theme, post, DM)..." autocomplete="off">
          <span class="kbd-badge">ESC to exit</span>
        </div>
        <div class="command-list" id="commandList"></div>
      </div>
    `;
    document.body.appendChild(backdrop);

    on(backdrop, 'click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('active');
    });

    const searchInput = $('#commandSearch', backdrop);
    on(searchInput, 'input', () => {
      const q = searchInput.value.trim().toLowerCase();
      renderCommands(q);
    });
  }

  const renderCommands = (filter = '') => {
    const list = $('#commandList', backdrop);
    const filtered = COMMANDS.filter((c) => !filter || c.label.toLowerCase().includes(filter));
    list.innerHTML = filtered.map((c, i) => `
      <button type="button" class="command-item" data-idx="${i}">
        <span class="command-item-left">
          <i class="fa-solid fa-terminal" style="font-size: 11px; color: var(--accent);"></i>
          ${escapeHtml(c.label)}
        </span>
        <span class="kbd-badge">${escapeHtml(c.key)}</span>
      </button>
    `).join('');

    $$('.command-item', list).forEach((item) => {
      on(item, 'click', () => {
        backdrop.classList.remove('active');
        const idx = Number(item.dataset.idx);
        filtered[idx]?.action();
      });
    });
  };

  renderCommands('');
  backdrop.classList.toggle('active');
  if (backdrop.classList.contains('active')) {
    $('#commandSearch', backdrop).value = '';
    $('#commandSearch', backdrop).focus();
    sounds.pop();
  }
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  saveState();
  const soundBtn = $('#soundBtn');
  if (soundBtn) {
    soundBtn.classList.toggle('muted', !state.soundEnabled);
    soundBtn.innerHTML = state.soundEnabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
  }
  if (state.soundEnabled) sounds.pop();
  announce(state.soundEnabled ? 'Audio vibes on.' : 'Audio vibes muted.');
}

/* ==========================================================================
   Feed Post Actions & Emoji Reaction Dock
   ========================================================================== */
function setupReactionDocks() {
  $$('.post-card').forEach((card) => {
    const likeBtn = $('.like-btn', card);
    if (!likeBtn || likeBtn.dataset.dockBound) return;
    likeBtn.dataset.dockBound = 'true';

    const dock = document.createElement('div');
    dock.className = 'reaction-dock';
    dock.innerHTML = `
      <button type="button" class="reaction-dock-item" data-reaction="❤️">❤️</button>
      <button type="button" class="reaction-dock-item" data-reaction="🔥">🔥</button>
      <button type="button" class="reaction-dock-item" data-reaction="✨">✨</button>
      <button type="button" class="reaction-dock-item" data-reaction="👏">👏</button>
      <button type="button" class="reaction-dock-item" data-reaction="☕️">☕️</button>
    `;
    likeBtn.parentElement.style.position = 'relative';
    likeBtn.parentElement.appendChild(dock);

    let hoverTimer = null;
    on(likeBtn, 'mouseenter', () => {
      hoverTimer = setTimeout(() => dock.classList.add('visible'), 300);
    });
    on(likeBtn.parentElement, 'mouseleave', () => {
      clearTimeout(hoverTimer);
      dock.classList.remove('visible');
    });

    $$('.reaction-dock-item', dock).forEach((item) => {
      on(item, 'click', (e) => {
        e.stopPropagation();
        const reaction = item.dataset.reaction;
        applyPostReaction(card, reaction);
        dock.classList.remove('visible');
      });
    });
  });
}

function applyPostReaction(post, reaction) {
  const postId = getPostId(post);
  const stats = getPostStats(post);
  stats.reaction = reaction;
  stats.likes += 1;
  saveState();
  updatePostCounts(post, stats);

  const likeBtn = $('.like-btn', post);
  likeBtn.classList.add('liked');
  likeBtn.innerHTML = `<span>${reaction}</span>`;
  triggerHeartBurst(post);
  sounds.reaction();
  announce(`Reacted with ${reaction}!`);
}

function handleLike(button) {
  const post = button.closest('.post-card');
  if (!post) return;
  const postId = getPostId(post);
  const stats = getPostStats(post);
  const liked = button.classList.toggle('liked');
  button.setAttribute('aria-pressed', String(liked));

  state.likedPosts = liked ? [...new Set([...state.likedPosts, postId])] : state.likedPosts.filter((id) => id !== postId);
  stats.likes = liked ? stats.likes + 1 : Math.max(0, stats.likes - 1);
  updatePostCounts(post, stats);
  state.postStats[postId] = stats;
  saveState();

  if (liked) {
    button.innerHTML = '<i class="fa-solid fa-heart" style="color: var(--accent);"></i>';
  } else {
    button.innerHTML = '<i class="fa-regular fa-heart"></i>';
  }

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
  const username = $('.username', post)?.textContent?.trim() || 'this moment';
  const postUrl = window.location.href;

  const body = document.createElement('div');
  body.className = 'share-panel';
  body.innerHTML = `
    <p>Share <strong>${escapeHtml(username)}</strong>'s moment with someone who would appreciate it.</p>
    <div class="share-options">
      <button type="button" data-share="copy"><i class="fa-solid fa-link"></i> Copy link</button>
      <button type="button" data-share="dm"><i class="fa-regular fa-paper-plane"></i> Send in chat</button>
    </div>
  `;
  $$('.share-options button', body).forEach((btn) => {
    on(btn, 'click', async () => {
      const type = btn.dataset.share;
      closeDialog();
      if (type === 'copy') {
        try {
          await navigator.clipboard.writeText(postUrl);
          announce('Moment link copied to clipboard.', 'success');
        } catch {
          announce('Link ready to copy from your browser bar.');
        }
      } else {
        openChat();
      }
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
    return list || '<p class="comment-summary">No comments yet. Start the conversation!</p>';
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
  const postId = getPostId(post);
  const menu = document.createElement('div');
  menu.className = 'choice-list';
  const postcard = makeButton('🖼 Export fine art postcard', 'choice-item');
  const exif = makeButton('Inspect camera & exposure data (EXIF)', 'choice-item');
  const copy = makeButton('Copy link to moment', 'choice-item');
  const mute = makeButton('Mute this creator', 'choice-item');
  const report = makeButton('Report inappropriate content', 'choice-item danger');

  on(postcard, 'click', () => {
    closeDialog();
    openPostcardExport(postId);
  });
  on(exif, 'click', () => {
    closeDialog();
    showExifDetails(postId);
  });
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

  menu.append(postcard, exif, copy, mute, report);
  openDialog('Post options', menu, 'Manage');
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
  return stats;
}

function updatePostCounts(post, stats) {
  const likes = $('.likes-count strong', post);
  const comments = $('.view-comments', post);
  if (likes) likes.textContent = `${stats.likes.toLocaleString()} likes`;
  if (comments) comments.textContent = `View all ${stats.commentCount} comments`;

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

function setupHeartBurst(post) {
  const imageBox = $('.post-image, .carousel-container', post);
  if (!imageBox) return;

  let lastTap = 0;
  on(imageBox, 'click', () => {
    const now = Date.now();
    const delta = now - lastTap;
    if (delta < 300 && delta > 0) {
      triggerHeartBurst(post);
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

function triggerHeartBurst(post) {
  const imageBox = $('.post-image, .carousel-container', post);
  if (!imageBox) return;
  const burst = document.createElement('div');
  burst.className = 'heart-burst';
  burst.innerHTML = '<i class="fa-solid fa-heart"></i>';
  imageBox.appendChild(burst);
  sounds.pop();
  setTimeout(() => burst.remove(), 850);
}

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
    this.duration = 4500;
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

    const card = $('.story-card', this.modal);
    on(card, 'mousedown', () => this.pause());
    on(card, 'mouseup', () => this.resume());
    on(card, 'touchstart', () => this.pause(), { passive: true });
    on(card, 'touchend', () => this.resume());

    $$('.story-emoji-btn', this.modal).forEach((btn) => {
      on(btn, 'click', (e) => {
        const emoji = btn.dataset.emoji;
        this.spawnFloatingEmoji(emoji);
        sounds.reaction();
      });
    });

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
  }

  open(startIndex = 0) {
    this.ensureModal();
    const list = state.myStory ? [state.myStory, ...STORIES_DATA] : STORIES_DATA;
    this.stories = list;
    this.currentIndex = Math.max(0, Math.min(startIndex, list.length - 1));
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
    const count = this.stories?.length || STORIES_DATA.length;
    container.innerHTML = Array.from({ length: count }, (_, i) => `
      <div class="story-progress-bar">
        <div class="story-progress-fill" id="progress-${i}"></div>
      </div>
    `).join('');
  }

  loadStory(index) {
    clearInterval(this.timer);
    const list = this.stories || STORIES_DATA;
    const story = list[index];
    if (!story) return this.close();

    $('#storyAvatar', this.modal).src = story.avatar;
    $('#storyName', this.modal).textContent = story.username;
    $('#storyMeta', this.modal).textContent = `${story.time} · ${story.location}`;
    $('#storyImage', this.modal).src = story.image;
    $('#storyCaption', this.modal).textContent = story.caption;

    list.forEach((_, i) => {
      const fill = $(`#progress-${i}`, this.modal);
      if (!fill) return;
      fill.style.width = i < index ? '100%' : '0%';
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
    const list = this.stories || STORIES_DATA;
    if (this.currentIndex < list.length - 1) {
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

  pause() { this.isPaused = true; }
  resume() { this.isPaused = false; }

  spawnFloatingEmoji(emoji) {
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
    openStoryCreator();
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
    reader.onerror = () => announce('Image could not be read.', 'error');
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
      <div class="user-info" data-creator="${escapeHtml(username)}">
        <img src="${escapeHtml(state.profile.avatar)}" alt="${escapeHtml(username)}" class="user-avatar">
        <div class="user-details">
          <span class="username">${escapeHtml(username)} <i class="fa-solid fa-circle-check verified" aria-label="Verified"></i></span>
          <span class="location">${escapeHtml(location || 'Shared just now')}</span>
        </div>
      </div>
      <button class="post-options" aria-label="More options"><i class="fa-solid fa-ellipsis"></i></button>
    </div>
    <div class="post-image" title="Double click to like">
      <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(caption || 'Moment on Mikesta')}" class="${escapeHtml(filter)}">
      <div class="camera-badge" data-post-id="${id}">
        <i class="fa-solid fa-camera"></i> <span>Leica M11 · 35mm</span>
      </div>
    </div>
    <div class="post-actions">
      <div class="action-buttons">
        <div class="like-btn-wrapper">
          <button class="action-btn like-btn" aria-label="Like post" aria-pressed="false"><i class="fa-regular fa-heart"></i></button>
        </div>
        <button class="action-btn" aria-label="Comment"><i class="fa-regular fa-comment"></i></button>
        <button class="action-btn" aria-label="Share"><i class="fa-regular fa-paper-plane"></i></button>
      </div>
      <button class="action-btn save-btn" aria-label="Save post" aria-pressed="false"><i class="fa-regular fa-bookmark"></i></button>
    </div>
    <div class="post-info">
      <div class="likes-count"><strong>0 likes</strong></div>
      <div class="post-caption"><strong data-creator="${escapeHtml(username)}">${escapeHtml(username)}</strong> ${escapeHtml(caption || 'A small moment worth keeping.')}</div>
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
  setupReactionDocks();
  setupCardTilt();

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
   Live Autocomplete Search
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
   Notifications
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
   Post Lightbox Modal
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

  $$('.profile-tabs button').forEach((tab, index) => {
    on(tab, 'click', () => {
      $$('.profile-tabs button').forEach((item) => item.classList.remove('active'));
      tab.classList.add('active');
      sounds.pop();
      if (index === 1) {
        renderSavedProfileGrid();
        announce('Showing your saved collection.');
      } else if (index === 2) {
        renderStacksProfileGrid();
        announce('Showing your curated moodboard stacks.');
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
  const colTabs = $('.collection-tabs');
  if (colTabs) colTabs.remove();

  $$('.user-post-tile, .profile-grid-item', grid).forEach((el) => el.remove());

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

  let colTabs = $('.collection-tabs');
  if (!colTabs) {
    colTabs = document.createElement('div');
    colTabs.className = 'collection-tabs';
    colTabs.innerHTML = `
      <button class="collection-pill active" data-col="all">All Saved</button>
      <button class="collection-pill" data-col="arch">Architecture</button>
      <button class="collection-pill" data-col="atmo">Atmosphere</button>
      <button class="collection-pill" data-col="travel">Travel</button>
    `;
    grid.parentElement.insertBefore(colTabs, grid);

    $$('.collection-pill', colTabs).forEach((pill) => {
      on(pill, 'click', () => {
        $$('.collection-pill', colTabs).forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        sounds.pop();
      });
    });
  }

  const savedIds = state.savedPosts;
  if (!savedIds.length) {
    grid.innerHTML = `
      <div class="empty-saved-state">
        <i class="fa-regular fa-bookmark"></i>
        <h3>No saved moments yet</h3>
        <p>Tap the bookmark icon on any photo in your circle to save it to your private collection.</p>
      </div>
    `;
    return;
  }

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
   Interactive World Map of Moments
   ========================================================================== */
const MAP_LOCATIONS = [
  {
    id: 'post-1',
    title: 'Rockaway Beach',
    coords: '40.5853° N, 73.8160° W',
    creator: 'mike.photos',
    avatar: 'https://i.pravatar.cc/150?img=10',
    x: 23,
    y: 34,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    tag: 'coast'
  },
  {
    id: 'post-2',
    title: 'Alfama, Lisbon',
    coords: '38.7118° N, 9.1306° W',
    creator: 'travel.adventures',
    avatar: 'https://i.pravatar.cc/150?img=8',
    x: 46,
    y: 33,
    image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=400&q=80',
    tag: 'architecture'
  },
  {
    id: 'post-3',
    title: 'Greenpoint, Brooklyn',
    coords: '40.7282° N, 73.9537° W',
    creator: 'ava.studio',
    avatar: 'https://i.pravatar.cc/150?img=1',
    x: 24.5,
    y: 35.5,
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
    tag: 'coffee'
  },
  {
    id: 'post-4',
    title: 'Redwood National Park',
    coords: '41.2132° N, 124.0046° W',
    creator: 'sam.builds',
    avatar: 'https://i.pravatar.cc/150?img=5',
    x: 16,
    y: 32,
    image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=400&q=80',
    tag: 'nature'
  },
  {
    id: 'tokyo-1',
    title: 'Shibuya, Tokyo',
    coords: '35.6595° N, 139.7005° E',
    creator: 'nora.eats',
    avatar: 'https://i.pravatar.cc/150?img=4',
    x: 82,
    y: 38,
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80',
    tag: 'featured'
  },
  {
    id: 'iceland-1',
    title: 'Reykjavik Coast',
    coords: '64.1466° N, 21.9426° W',
    creator: 'maya.moves',
    avatar: 'https://i.pravatar.cc/150?img=2',
    x: 44,
    y: 20,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    tag: 'nature'
  },
  {
    id: 'hudson-1',
    title: 'Hudson Valley Ridge',
    coords: '41.7472° N, 74.0868° W',
    creator: 'chris.cole',
    avatar: 'https://i.pravatar.cc/150?img=12',
    x: 23.8,
    y: 32.5,
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=80',
    tag: 'nature'
  }
];

function openWorldMap() {
  let modal = $('#worldMapModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'worldMapModal';
    modal.className = 'map-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'World Map of Moments');
    modal.innerHTML = `
      <div class="map-modal-card">
        <div class="map-modal-header">
          <div style="display: flex; align-items: center; gap: 12px;">
            <i class="fa-solid fa-earth-americas" style="color: var(--accent); font-size: 20px;"></i>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: var(--ink);">World Map of Moments</h3>
              <span style="font-family: 'DM Mono', monospace; font-size: 11px; color: var(--muted);">${MAP_LOCATIONS.length} global coordinates documented across 4 continents</span>
            </div>
          </div>
          <button type="button" class="close-modal" id="closeMapModal" aria-label="Close Map">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="map-canvas-container" id="mapCanvasContainer">
          <svg class="world-map-svg" viewBox="0 0 1000 500" preserveAspectRatio="none">
            <defs>
              <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#243833" stop-opacity="0.6"/>
                <stop offset="100%" stop-color="#141e1c" stop-opacity="1"/>
              </radialGradient>
            </defs>
            <rect width="1000" height="500" fill="url(#mapGlow)"/>
            <line x1="0" y1="125" x2="1000" y2="125" stroke="#1d2d2a" stroke-width="1" stroke-dasharray="4 4"/>
            <line x1="0" y1="250" x2="1000" y2="250" stroke="#283e39" stroke-width="1.5" stroke-dasharray="6 4"/>
            <line x1="0" y1="375" x2="1000" y2="375" stroke="#1d2d2a" stroke-width="1" stroke-dasharray="4 4"/>
            <line x1="250" y1="0" x2="250" y2="500" stroke="#1d2d2a" stroke-width="1" stroke-dasharray="4 4"/>
            <line x1="500" y1="0" x2="500" y2="500" stroke="#283e39" stroke-width="1.5" stroke-dasharray="6 4"/>
            <line x1="750" y1="0" x2="750" y2="500" stroke="#1d2d2a" stroke-width="1" stroke-dasharray="4 4"/>
            <!-- Continents -->
            <path d="M 120,80 Q 210,60 270,90 Q 310,140 260,210 Q 210,230 190,290 Q 150,260 130,190 Z" fill="#20332e" opacity="0.85"/>
            <path d="M 240,280 Q 320,310 290,410 Q 260,470 230,440 Q 210,360 240,280 Z" fill="#20332e" opacity="0.85"/>
            <path d="M 440,90 Q 530,80 540,140 Q 480,180 430,150 Z" fill="#20332e" opacity="0.85"/>
            <path d="M 450,180 Q 560,190 540,310 Q 490,410 440,330 Q 420,240 450,180 Z" fill="#20332e" opacity="0.85"/>
            <path d="M 540,80 Q 770,70 860,140 Q 820,270 700,280 Q 610,210 540,140 Z" fill="#20332e" opacity="0.85"/>
            <path d="M 740,330 Q 840,330 830,410 Q 750,420 740,330 Z" fill="#20332e" opacity="0.85"/>
          </svg>

          <div class="map-pins-layer" id="mapPinsLayer"></div>

          <div class="map-popup-card" id="mapPopupCard">
            <img class="map-popup-img" id="mapPopupImg" src="" alt="">
            <div class="map-popup-info">
              <h4 class="map-popup-title" id="mapPopupTitle"></h4>
              <div class="map-popup-author" id="mapPopupAuthor"></div>
              <button type="button" class="tag-pill active" id="mapPopupActionBtn" style="font-size: 11px; padding: 4px 10px;">Inspect Moment</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = $('#closeMapModal', modal);
    on(closeBtn, 'click', () => modal.classList.remove('active'));
    on(modal, 'click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });

    const container = $('#mapPinsLayer', modal);
    MAP_LOCATIONS.forEach((loc) => {
      const pin = document.createElement('div');
      pin.className = 'map-pin';
      pin.style.left = `${loc.x}%`;
      pin.style.top = `${loc.y}%`;
      pin.title = `${loc.title} · ${loc.creator}`;
      pin.innerHTML = `
        <div class="pin-pulse"></div>
        <div class="pin-dot"></div>
      `;

      on(pin, 'click', (e) => {
        e.stopPropagation();
        sounds.pop();
        showMapPopup(loc);
      });

      container.appendChild(pin);
    });

    on($('#mapCanvasContainer', modal), 'click', (e) => {
      if (!e.target.closest('.map-pin') && !e.target.closest('#mapPopupCard')) {
        $('#mapPopupCard', modal)?.classList.remove('open');
      }
    });
  }

  const showMapPopup = (loc) => {
    const card = $('#mapPopupCard', modal);
    const img = $('#mapPopupImg', modal);
    const title = $('#mapPopupTitle', modal);
    const author = $('#mapPopupAuthor', modal);
    const actionBtn = $('#mapPopupActionBtn', modal);

    img.src = loc.image;
    title.textContent = loc.title;
    author.textContent = `@${loc.creator} · ${loc.coords}`;
    card.classList.add('open');

    actionBtn.onclick = () => {
      modal.classList.remove('active');
      sounds.pop();
      const targetPost = $(`[data-post-id="${loc.id}"]`);
      if (targetPost) {
        targetPost.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetPost.style.transition = 'box-shadow 0.4s ease';
        targetPost.style.boxShadow = '0 0 0 3px var(--accent)';
        setTimeout(() => targetPost.style.boxShadow = '', 2000);
      } else if (loc.tag) {
        filterFeedByTag(loc.tag);
      }
    };
  };

  modal.classList.add('active');
  sounds.pop();
  announce('World Map of Moments opened.');
}

/* ==========================================================================
   Fine Art Editorial Postcard Export Modal
   ========================================================================== */
function openPostcardExport(postId = 'post-1') {
  let modal = $('#postcardModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'postcardModal';
    modal.className = 'postcard-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Fine Art Postcard Export');
    modal.innerHTML = `
      <div class="postcard-card">
        <div class="map-modal-header" style="padding: 16px 24px; border-bottom: 1px solid var(--line);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid fa-stamp" style="color: var(--accent); font-size: 18px;"></i>
            <div>
              <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: var(--ink);">Fine Art Editorial Postcard</h3>
              <span style="font-family: 'DM Mono', monospace; font-size: 10px; color: var(--muted);">Archival Print & Typography Specification</span>
            </div>
          </div>
          <button type="button" class="close-modal" id="closePostcardModal" aria-label="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="postcard-print-area" id="postcardPrintArea">
          <div class="postcard-image-frame">
            <img id="postcardPreviewImg" src="" alt="Postcard Moment" crossorigin="anonymous">
          </div>
          <h2 class="postcard-title" id="postcardTitle">Moment Study</h2>
          <div class="postcard-meta" id="postcardMeta">LEICA M11 · 35MM F/1.4 · 1/500S · ISO 100</div>
          <div class="postcard-seal">
            <i class="fa-solid fa-certificate"></i>
            <span>✦ MIKESTA ARCHIVE · NEW YORK ✦</span>
          </div>
        </div>
        <div class="postcard-footer-bar">
          <button type="button" class="button-outline" id="postcardCopyBtn">Copy Share Link</button>
          <button type="button" class="dialog-action" id="postcardDownloadBtn">
            <i class="fa-solid fa-arrow-down-to-bracket"></i> Download Fine Art Card
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    on($('#closePostcardModal', modal), 'click', () => modal.classList.remove('active'));
    on(modal, 'click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });

    on($('#postcardCopyBtn', modal), async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        announce('Postcard link copied to clipboard.', 'success');
      } catch {
        announce('Link ready in your browser address bar.');
      }
      sounds.pop();
    });

    on($('#postcardDownloadBtn', modal), () => {
      generatePostcardCanvasDownload(modal.dataset.currentPostId || 'post-1');
    });
  }

  modal.dataset.currentPostId = postId;
  const postEl = $(`[data-post-id="${postId}"]`);
  const exif = POST_EXIF[postId] || {
    camera: 'Leica M11',
    lens: 'Summilux 35mm f/1.4',
    shutter: '1/500s',
    aperture: 'f/1.4',
    iso: 'ISO 100'
  };

  const imgEl = $('#postcardPreviewImg', modal);
  const titleEl = $('#postcardTitle', modal);
  const metaEl = $('#postcardMeta', modal);

  let imgSrc = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=85';
  let titleText = 'Rockaway Tide Study';

  if (postEl) {
    const postImg = $('img', postEl);
    if (postImg) imgSrc = postImg.src;
    const caption = $('.post-caption', postEl)?.textContent || '';
    if (caption) titleText = caption.replace(/^[a-z0-9._]+\s*/i, '').slice(0, 48) || titleText;
  }

  imgEl.src = imgSrc;
  titleEl.textContent = titleText;
  metaEl.textContent = `${exif.camera.toUpperCase()} · ${exif.lens.toUpperCase()} · ${exif.shutter} · ${exif.iso}`;

  modal.classList.add('active');
  sounds.pop();
  announce('Postcard studio opened.');
}

function generatePostcardCanvasDownload(postId) {
  const modal = $('#postcardModal');
  const imgEl = $('#postcardPreviewImg', modal);
  const titleText = $('#postcardTitle', modal)?.textContent || 'Moment Study';
  const metaText = $('#postcardMeta', modal)?.textContent || 'LEICA M11 · 35MM F/1.4';

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d');

  // Fine art paper background
  ctx.fillStyle = '#FAF8F5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle inner border
  ctx.strokeStyle = '#E6E2D8';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  const drawCardTextsAndDownload = () => {
    // Title
    ctx.fillStyle = '#1A2422';
    ctx.font = 'italic 52px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(titleText, 600, 1140);

    // Meta plate
    ctx.fillStyle = '#7B8883';
    ctx.font = '600 22px "DM Mono", Menlo, monospace';
    ctx.letterSpacing = '2px';
    ctx.fillText(metaText, 600, 1220);

    // Archive seal
    ctx.strokeStyle = '#DCD7CE';
    ctx.lineWidth = 2;
    ctx.strokeRect(420, 1280, 360, 56);

    ctx.fillStyle = '#928B80';
    ctx.font = '700 18px "DM Mono", Menlo, monospace';
    ctx.fillText('✦ MIKESTA ARCHIVE · NEW YORK ✦', 600, 1316);

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `mikesta-postcard-${postId}.png`;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      a.remove();
      triggerShutterFlash();
      announce('Fine art postcard downloaded to your device.', 'success');
    } catch {
      triggerShutterFlash();
      announce('High-res postcard preview compiled.', 'success');
    }
  };

  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => {
    ctx.fillStyle = '#E8E4DC';
    ctx.fillRect(96, 96, 1008, 928);
    ctx.drawImage(image, 100, 100, 1000, 920);
    drawCardTextsAndDownload();
  };
  image.onerror = () => {
    ctx.fillStyle = '#3E5C56';
    ctx.fillRect(100, 100, 1000, 920);
    ctx.fillStyle = '#FAF8F5';
    ctx.font = 'bold 36px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MIKESTA EDITORIAL PHOTOGRAPHY', 600, 560);
    drawCardTextsAndDownload();
  };
  image.src = imgEl.src;
}

/* ==========================================================================
   Visual Keyboard Shortcuts Guide Modal
   ========================================================================== */
function openKeyboardGuide() {
  let modal = $('#keyboardGuideModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'keyboardGuideModal';
    modal.className = 'keyboard-guide-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Keyboard Shortcuts Guide');

    const SHORTCUTS = [
      { key: '⌘K', desc: 'Open Linear Command Palette' },
      { key: '?', desc: 'Show this shortcuts guide' },
      { key: 'Z', desc: 'Toggle Zen reading focus mode' },
      { key: 'W', desc: 'Explore World Moments Map' },
      { key: 'E', desc: 'Export fine art postcard' },
      { key: 'C', desc: 'Camera shutter snapshot flash' },
      { key: 'G', desc: 'Toggle analog film grain texture' },
      { key: 'T', desc: 'Cycle aesthetic vibes (theme)' },
      { key: 'M', desc: 'Mute / Unmute tactile soundscapes' },
      { key: 'R', desc: 'Toggle Ambient Circle Radio' },
      { key: 'D', desc: 'Open Direct Messages drawer' },
      { key: 'N', desc: 'Create new moment (Upload)' },
      { key: 'S', desc: 'Open Story Studio creator' },
      { key: 'J / K', desc: 'Smooth scroll feed posts' },
      { key: '/', desc: 'Focus instant search bar' },
      { key: 'ESC', desc: 'Dismiss active sheet or modal' }
    ];

    modal.innerHTML = `
      <div class="keyboard-guide-card">
        <div class="keyboard-guide-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid fa-keyboard" style="color: var(--accent); font-size: 18px;"></i>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: var(--ink);">Keyboard Shortcuts</h3>
              <span style="font-family: 'DM Mono', monospace; font-size: 10px; color: var(--muted);">Pro Navigation Matrix</span>
            </div>
          </div>
          <button type="button" class="close-modal" id="closeKeyboardGuide" aria-label="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="keyboard-guide-grid">
          ${SHORTCUTS.map((s) => `
            <div class="shortcut-row">
              <span class="shortcut-desc">${escapeHtml(s.desc)}</span>
              <span class="key-cap">${escapeHtml(s.key)}</span>
            </div>
          `).join('')}
        </div>
        <div style="padding: 14px 24px; border-top: 1px solid var(--line); background: var(--paper); display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12px; color: var(--muted);">Press any key anytime to navigate without a mouse.</span>
          <button type="button" class="tag-pill active" id="tryCommandPaletteBtn">Try ⌘K Now</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    on($('#closeKeyboardGuide', modal), 'click', () => modal.classList.remove('active'));
    on(modal, 'click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });

    on($('#tryCommandPaletteBtn', modal), () => {
      modal.classList.remove('active');
      toggleCommandPalette();
    });
  }

  modal.classList.add('active');
  sounds.pop();
  announce('Keyboard guide opened.');
}

/* ==========================================================================
   Stacks / Moodboards Decks (Profile Stacks Tab)
   ========================================================================== */
const PROFILE_STACKS = [
  {
    id: 'stack-coast',
    title: 'Atlantic Horizons',
    count: '12 moments',
    subtitle: 'Rockaway · Montauk · Cape May',
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'stack-arch',
    title: 'Architectural Solitude',
    count: '18 moments',
    subtitle: 'Lisbon · Berlin · Brooklyn',
    images: [
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'stack-coffee',
    title: 'Morning Rituals',
    count: '9 moments',
    subtitle: 'Espresso · Cedar · Notebooks',
    images: [
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'stack-tokyo',
    title: 'Tokyo Street Forms',
    count: '14 moments',
    subtitle: 'Shibuya · Daikanyama · Nakameguro',
    images: [
      'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80'
    ]
  }
];

function renderStacksProfileGrid() {
  const grid = $('.profile-grid');
  if (!grid) return;
  const colTabs = $('.collection-tabs');
  if (colTabs) colTabs.remove();

  grid.innerHTML = `
    <div class="stacks-grid" style="grid-column: 1 / -1;">
      ${PROFILE_STACKS.map((stack) => `
        <div class="stack-card" data-stack-id="${stack.id}">
          <div class="stack-deck-preview">
            <div class="stack-layer"><img src="${stack.images[0]}" alt="${escapeHtml(stack.title)}"></div>
            <div class="stack-layer"><img src="${stack.images[1]}" alt="${escapeHtml(stack.title)}"></div>
            <div class="stack-layer"><img src="${stack.images[2]}" alt="${escapeHtml(stack.title)}"></div>
          </div>
          <div class="stack-info">
            <h4>${escapeHtml(stack.title)}</h4>
            <span>${escapeHtml(stack.count)} · ${escapeHtml(stack.subtitle)}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  $$('.stack-card', grid).forEach((card) => {
    on(card, 'click', () => {
      sounds.pop();
      const stackId = card.dataset.stackId;
      const stack = PROFILE_STACKS.find((s) => s.id === stackId);
      if (!stack) return;

      const body = document.createElement('div');
      body.innerHTML = `
        <p style="margin-top: 0; font-size: 13px; color: var(--muted);">${escapeHtml(stack.subtitle)} · Curated series</p>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 16px 0;">
          ${stack.images.map((img) => `
            <img src="${img}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px; cursor: pointer;" alt="${escapeHtml(stack.title)}">
          `).join('')}
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" class="button-outline" id="stackPostcardBtn">Export as Postcard</button>
          <button type="button" class="dialog-action" id="stackAddBtn">Add Photo to Stack</button>
        </div>
      `;

      on($('#stackPostcardBtn', body), () => {
        closeDialog();
        openPostcardExport('post-1');
      });

      on($('#stackAddBtn', body), () => {
        closeDialog();
        announce(`Select a photo from your library to add to ${stack.title}.`);
        window.openUploadModal?.();
      });

      $$('img', body).forEach((img) => {
        on(img, 'click', () => {
          closeDialog();
          openLightbox({
            image: img.src,
            username: 'mike.photos',
            caption: `${stack.title} · ${stack.subtitle}`,
            location: 'Archival Series'
          });
        });
      });

      openDialog(stack.title, body, 'Moodboard Stack');
    });
  });
}

/* ==========================================================================
   State Restoration & Global Event Listeners
   ========================================================================== */
function restoreState() {
  applyTheme(state.theme);

  const soundBtn = $('#soundBtn');
  if (soundBtn) {
    soundBtn.classList.toggle('muted', !state.soundEnabled);
    soundBtn.innerHTML = state.soundEnabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
    on(soundBtn, 'click', toggleSound);
  }

  const radioBtn = $('#ambientRadioBtn');
  if (radioBtn) {
    on(radioBtn, 'click', () => sounds.toggleAmbientRadio());
  }

  const vibeBtn = $('#vibeBtn');
  if (vibeBtn) on(vibeBtn, 'click', showThemeMenu);

  const kbdBtn = $('#kbdBtn');
  if (kbdBtn) on(kbdBtn, 'click', toggleCommandPalette);

  const chatBtn = $('#chatBtn');
  if (chatBtn) on(chatBtn, 'click', openChat);

  const spotlightBtn = $('#spotlightViewBtn');
  if (spotlightBtn) {
    on(spotlightBtn, 'click', () => {
      openLightbox({
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
        username: 'mike.photos',
        location: 'Rockaway Beach, NY',
        caption: '“A little more blue before the day gets loud.” Shot on Leica M11 with Summilux 35mm f/1.4.'
      });
    });
  }

  const worldMapPill = $('#worldMapPill');
  if (worldMapPill) on(worldMapPill, 'click', openWorldMap);

  const footerMapBtn = $('#footerMapBtn');
  if (footerMapBtn) on(footerMapBtn, 'click', openWorldMap);

  const keyboardGuideBtn = $('#keyboardGuideBtn');
  if (keyboardGuideBtn) on(keyboardGuideBtn, 'click', openKeyboardGuide);

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

  setupReactionDocks();
  setupCarousels();
  setupCardTilt();

  $$('.follow-btn').forEach((button) => {
    const username = $('.suggestion-username', button.closest('.suggestion-item'))?.textContent;
    if (state.followedUsers.includes(username)) {
      button.classList.add('following');
      button.textContent = 'Following';
    }
  });

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
    on(filter, 'click', (event) => {
      const menu = document.createElement('div');
      menu.className = 'choice-list';
      ['Following', 'For you', 'Recent'].forEach((option) => {
        const item = makeButton(`${option}${state.feed === option ? '  ✓' : ''}`, 'choice-item', { type: 'button' });
        on(item, 'click', () => {
          state.feed = option;
          saveState();
          filter.innerHTML = `${option} <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>`;
          closeDialog();
          announce(`Feed set to ${option}.`);
        });
        menu.appendChild(item);
      });
      openDialog('Choose your feed', menu, 'View');
    });
  }

  on($('.stories-heading button'), 'click', () => storyViewer.open(0));
  on($('.see-all'), 'click', () => announce('Viewing all recommended creators.'));
  on($('#notifBtn'), 'click', showNotifications);
  on($('#mobileNotifBtn'), 'click', showNotifications);

  document.addEventListener('click', (event) => {
    const target = event.target.closest('button, .story-item, .camera-badge, [data-creator]');
    if (!target) return;
    const post = target.closest('.post-card');

    if (target.matches('.camera-badge')) {
      const id = target.dataset.postId || getPostId(post);
      return showExifDetails(id);
    }
    if (target.matches('[data-creator]')) {
      const user = target.dataset.creator;
      return showCreatorProfile(user);
    }
    if (target.matches('.like-btn')) return handleLike(target);
    if (target.matches('.save-btn')) return handleSave(target);
    if (target.matches('.view-comments, .action-btn[aria-label="Comment"]')) return showComments(post);
    if (target.matches('.action-btn[aria-label="Share"]')) return handleShare(post);
    if (target.matches('.post-options')) return showPostMenu(post);
    if (target.matches('.story-item')) return showStory(target);
    if (target.matches('.follow-btn')) return handleFollow(target);
  });
}

/* ==========================================================================
   Zen Mode, Film Grain & Shutter Flash Systems
   ========================================================================== */
function triggerShutterFlash() {
  let flash = $('#shutterFlashOverlay');
  if (!flash) {
    flash = document.createElement('div');
    flash.id = 'shutterFlashOverlay';
    flash.className = 'shutter-flash-overlay';
    document.body.appendChild(flash);
  }
  flash.classList.add('flashing');
  sounds.shutter();
  requestAnimationFrame(() => {
    setTimeout(() => flash.classList.remove('flashing'), 40);
  });
}

function toggleGrain() {
  const grain = $('.film-grain-layer');
  if (!grain) return;
  const isHidden = grain.classList.toggle('hidden');
  sounds.pop();
  announce(isHidden ? 'Film grain disabled.' : 'Analog film grain enabled.');
}

function toggleZenMode() {
  const isZen = document.body.classList.toggle('zen-mode');
  let pill = $('#zenFloatingPill');
  if (!pill) {
    pill = document.createElement('div');
    pill.id = 'zenFloatingPill';
    pill.className = 'zen-floating-pill';
    pill.innerHTML = `
      <span><i class="fa-solid fa-feather"></i> Zen Reading Mode</span>
      <button type="button" class="zen-exit-btn" id="zenExitBtn">Exit (Z)</button>
    `;
    document.body.appendChild(pill);
    on($('#zenExitBtn', pill), 'click', toggleZenMode);
  }
  sounds.pop();
  announce(isZen ? 'Zen Focus Mode activated. Press Z or ESC to exit.' : 'Exited Zen mode.');
}

// Global Keyboard Navigation
on(document, 'keydown', (event) => {
  const activeTag = document.activeElement?.tagName;
  const isInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

  if (event.key === 'Escape') {
    if (document.body.classList.contains('zen-mode')) {
      toggleZenMode();
      return;
    }
    closeDialog();
    closeChat();
    storyViewer.close();
    $('#lightboxModal')?.classList.remove('active');
    $('#commandPaletteBackdrop')?.classList.remove('active');
    $('#creatorModal')?.classList.remove('active');
    $('#worldMapModal')?.classList.remove('active');
    $('#postcardModal')?.classList.remove('active');
    $('#keyboardGuideModal')?.classList.remove('active');
    return;
  }

  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault();
    toggleCommandPalette();
    return;
  }

  if (isInput) return;

  if (event.key === '?') {
    event.preventDefault();
    openKeyboardGuide();
  } else if (event.key === 'z' || event.key === 'Z') {
    toggleZenMode();
  } else if (event.key === 'g' || event.key === 'G') {
    toggleGrain();
  } else if (event.key === 'c' || event.key === 'C') {
    triggerShutterFlash();
  } else if (event.key === 'w' || event.key === 'W') {
    openWorldMap();
  } else if (event.key === 'e' || event.key === 'E') {
    const post = $('.post-card');
    openPostcardExport(post ? getPostId(post) : 'post-1');
  } else if (event.key === 't' || event.key === 'T') {
    cycleTheme();
  } else if (event.key === 'm' || event.key === 'M') {
    toggleSound();
  } else if (event.key === 'r' || event.key === 'R') {
    sounds.toggleAmbientRadio();
  } else if (event.key === 'd' || event.key === 'D') {
    openChat();
  } else if (event.key === 'n' || event.key === 'N') {
    window.openUploadModal?.();
  } else if (event.key === '/') {
    event.preventDefault();
    $('.search-bar input')?.focus();
  } else if (event.key === 'j' || event.key === 'J') {
    const posts = $$('.post-card');
    const current = posts.find((p) => p.getBoundingClientRect().top > 50);
    current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (event.key === 'k' || event.key === 'K') {
    const posts = [...$$('.post-card')].reverse();
    const current = posts.find((p) => p.getBoundingClientRect().top < -50);
    current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// Start application
setupEvents();

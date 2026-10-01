import React, { useState } from 'react';
import { UserProfile } from '../lib/supabase';
import { store } from '../lib/store';

interface HeaderProps {
  currentUser: UserProfile | null;
  route: string;
  navigate: (route: 'feed' | 'profile', username?: string) => void;
  onUpload: () => void;
  onNotifications: () => void;
  onAuth: () => void;
  unreadCount: number;
  search: string;
  onSearchChange: (value: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  route,
  navigate,
  onUpload,
  onNotifications,
  onAuth,
  unreadCount,
  search,
  onSearchChange,
}) => {
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const profiles = store.getAvailableProfiles();

  const query = search.trim().toLowerCase();
  const matchingCreators = query
    ? store.getSuggestions().filter((s) => s.username.toLowerCase().includes(query))
    : [];

  return (
    <header className="navbar">
      <div className="nav-container">
        <button className="logo" onClick={() => navigate('feed')} aria-label="Mikesta home">
          <span className="logo-mark">
            <i className="fa-solid fa-camera" />
          </span>
          <span className="logo-word">Mikesta</span>
        </button>

        <div style={{ position: 'relative' }}>
          <label className="search-bar">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="search"
              placeholder="Search moments, people, places"
              aria-label="Search"
              value={search}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                style={{ fontSize: 11, color: 'var(--muted)', padding: '0 4px' }}
                title="Clear search"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </label>

          {/* Instant Search Dropdown */}
          {isSearchFocused && query && (
            <div
              style={{
                position: 'absolute',
                top: 44,
                left: 0,
                right: 0,
                background: 'var(--surface)',
                borderRadius: 12,
                boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
                border: '1px solid var(--line)',
                padding: '8px 6px',
                zIndex: 70,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', padding: '4px 10px', textTransform: 'uppercase' }}>
                Creators matching "{search}"
              </div>
              {matchingCreators.length > 0 ? (
                matchingCreators.map((creator) => (
                  <button
                    key={creator.id}
                    onClick={() => {
                      navigate('profile', creator.username);
                      onSearchChange('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      textAlign: 'left',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--mint)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <img
                      src={creator.avatar_url}
                      alt={creator.username}
                      style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 800 }}>{creator.username}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{creator.reason}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div style={{ padding: '8px 10px', fontSize: 11, color: 'var(--muted)' }}>
                  No creators found. Filtering feed by "{search}"...
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="nav-icons" aria-label="Primary navigation">
          <button
            className="nav-btn nav-btn-primary"
            onClick={onUpload}
            title="Create a post"
            aria-label="Create a post"
          >
            <i className="fa-solid fa-plus" />
          </button>

          <button
            className={`nav-btn ${route === 'feed' ? 'active-nav' : ''}`}
            onClick={() => navigate('feed')}
            title="Explore feed"
            aria-label="Explore"
          >
            <i className="fa-regular fa-compass" />
          </button>

          <button
            className="nav-btn"
            onClick={onNotifications}
            title="Notifications"
            aria-label="Notifications"
            style={{ position: 'relative' }}
          >
            <i className="fa-regular fa-heart" />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -4,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  border: '2px solid white',
                }}
              />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            className="nav-btn"
            onClick={() => store.toggleTheme()}
            title={`Switch to ${store.getTheme() === 'light' ? 'Dark' : 'Light'} theme`}
            aria-label="Toggle theme"
          >
            <i className={store.getTheme() === 'light' ? 'fa-regular fa-moon' : 'fa-solid fa-sun'} />
          </button>

          {/* Profile & Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              className={`nav-btn profile-nav ${route === 'profile' ? 'active-profile' : ''}`}
              onClick={() => navigate('profile')}
              title={`Logged in as ${currentUser?.username || 'Guest'}`}
              aria-label="Your profile"
            >
              {currentUser?.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.username}
                  style={{ width: 29, height: 29, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <span>{currentUser?.username?.slice(0, 1).toUpperCase() || <i className="fa-regular fa-user" />}</span>
              )}
            </button>

            {/* Quick Demo Switcher toggle button */}
            <button
              onClick={() => setShowSwitchMenu(!showSwitchMenu)}
              title="Switch user"
              style={{
                position: 'absolute',
                bottom: -4,
                right: -6,
                fontSize: 9,
                background: 'var(--ink)',
                color: 'white',
                borderRadius: '50%',
                width: 14,
                height: 14,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <i className="fa-solid fa-repeat" />
            </button>

            {showSwitchMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: 38,
                  right: 0,
                  width: 220,
                  background: 'var(--surface)',
                  borderRadius: 12,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  border: '1px solid var(--line)',
                  padding: 8,
                  zIndex: 60,
                }}
              >
                <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, padding: '4px 8px', textTransform: 'uppercase' }}>
                  Switch Profile
                </div>
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      store.switchUser(p);
                      setShowSwitchMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 6,
                      background: currentUser?.id === p.id ? 'var(--mint)' : 'transparent',
                      textAlign: 'left',
                      fontSize: 12,
                    }}
                  >
                    <img
                      src={p.avatar_url || ''}
                      alt={p.username}
                      style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700 }}>{p.username}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{p.display_name}</div>
                    </div>
                  </button>
                ))}
                <div style={{ borderTop: '1px solid var(--line)', marginTop: 6, paddingTop: 6 }}>
                  <button
                    onClick={() => {
                      setShowSwitchMenu(false);
                      onAuth();
                    }}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--accent)',
                      textAlign: 'left',
                    }}
                  >
                    <i className="fa-solid fa-arrow-right-to-bracket" style={{ marginRight: 6 }} />
                    Supabase Sign In / Register
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

import React, { ChangeEvent, useEffect, useState } from 'react';
import { UserProfile } from '../lib/supabase';

interface EditProfileDialogProps {
  profile: UserProfile | null;
  onSave: (updates: Partial<UserProfile>, avatarFile?: File | null) => Promise<void>;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
];

export const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  profile,
  onSave,
  onClose,
}) => {
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => () => {
    if (avatarUrl.startsWith('blob:')) URL.revokeObjectURL(avatarUrl);
  }, [avatarUrl]);

  const selectAvatarUrl = (url: string) => {
    setAvatarFile(null);
    setAvatarUrl(url);
    setError('');
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onSave({
        display_name: displayName.trim() || username.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, ''),
        bio: bio.trim(),
        avatar_url: avatarUrl.startsWith('blob:') ? profile?.avatar_url || '' : avatarUrl.trim(),
      }, avatarFile);
      onClose();
    } catch (err) {
      setError(err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
        ? err.message : 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-dialog open" role="dialog" aria-modal="true">
      <div className="app-dialog-card" style={{ maxWidth: 480 }}>
        <div className="app-dialog-header">
          <div>
            <p className="kicker">Profile settings</p>
            <h2>Edit profile</h2>
          </div>
          <button className="dialog-close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form className="app-dialog-body edit-form" onSubmit={handleSubmit}>
          {error && <p role="alert" style={{ color: '#ad4938' }}>{error}</p>}
          {/* Avatar Preview & Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <img
              src={avatarUrl || PRESET_AVATARS[0]}
              alt="Avatar preview"
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--accent)',
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>
                Choose preset or enter URL:
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {PRESET_AVATARS.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Preset ${i}`}
                    onClick={() => selectAvatarUrl(url)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      border: avatarUrl === url ? '2px solid var(--accent)' : '1px solid var(--line)',
                      objectFit: 'cover',
                    }}
                  />
                ))}
              </div>
              <label className="button-outline" style={{ display: 'inline-flex', marginTop: 8, cursor: 'pointer', fontSize: 11 }}>
                <i className="fa-solid fa-upload" />
                Upload image
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <label>
            Display name
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Elena Rodriguez"
              maxLength={50}
            />
          </label>

          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. elena_lens"
              maxLength={30}
              required
            />
          </label>

          <label>
            Avatar image URL
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => selectAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
          </label>

          <label>
            Bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your circle about your passions and style..."
              maxLength={240}
            />
          </label>

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button className="dialog-action" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button className="button-outline" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

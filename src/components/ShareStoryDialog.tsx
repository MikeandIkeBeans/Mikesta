import React, { useState } from 'react';

interface ShareStoryDialogProps {
  onAddStory: (params: { imageUrl: string; caption?: string }) => void;
  onClose: () => void;
}

const STORY_PRESETS = [
  {
    name: 'Sunset',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    caption: 'Chasing the last rays along the headlands. 🌅',
  },
  {
    name: 'Espresso Bar',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    caption: 'Midday pull. Cortado on point today. ☕',
  },
  {
    name: 'Studio',
    url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    caption: 'Clay in hand, mind at ease. 🌿',
  },
  {
    name: 'Night Street',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    caption: 'Tokyo neon and midnight rain. ☔',
  },
];

export const ShareStoryDialog: React.FC<ShareStoryDialogProps> = ({
  onAddStory,
  onClose,
}) => {
  const [selectedUrl, setSelectedUrl] = useState(STORY_PRESETS[0].url);
  const [caption, setCaption] = useState(STORY_PRESETS[0].caption);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUrl) return;
    onAddStory({ imageUrl: selectedUrl, caption });
    onClose();
  };

  return (
    <div className="app-dialog open" role="dialog" aria-modal="true">
      <div className="app-dialog-card" style={{ maxWidth: 460 }}>
        <div className="app-dialog-header">
          <div>
            <p className="kicker">Ephemeral moment</p>
            <h2>Share a story</h2>
          </div>
          <button className="dialog-close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form className="app-dialog-body" onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>
              Select a story moment:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {STORY_PRESETS.map((p) => (
                <div
                  key={p.name}
                  onClick={() => {
                    setSelectedUrl(p.url);
                    setCaption(p.caption);
                  }}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: selectedUrl === p.url ? '3px solid var(--accent)' : '1px solid var(--line)',
                    position: 'relative',
                  }}
                >
                  <img
                    src={p.url}
                    alt={p.name}
                    style={{ width: '100%', height: 75, objectFit: 'cover', display: 'block' }}
                  />
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '2px 4px',
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      textAlign: 'center',
                    }}
                  >
                    {p.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>
              Story caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add thoughts or emojis..."
              maxLength={120}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                fontSize: 12,
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="share-btn" type="submit">
              Post to Stories
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

import React from 'react';

interface ShortcutsModalProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { key: '?', description: 'Open keyboard shortcuts help' },
  { key: 'n', description: 'Create new post / share moment' },
  { key: 't', description: 'Toggle dark / light theme' },
  { key: 'j / k', description: 'Navigate next / previous post' },
  { key: 'l', description: 'Like / unlike focused post' },
  { key: 'c', description: 'Toggle comments on focused post' },
  { key: 's', description: 'Bookmark / save focused post' },
  { key: 'Esc', description: 'Close any active modal or story' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  return (
    <div className="app-dialog open" role="dialog" aria-modal="true">
      <div className="app-dialog-card" style={{ maxWidth: 440 }}>
        <div className="app-dialog-header">
          <div>
            <p className="kicker">Power user</p>
            <h2>Keyboard shortcuts</h2>
          </div>
          <button className="dialog-close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="app-dialog-body" style={{ padding: '16px 24px 24px' }}>
          <div style={{ display: 'grid', gap: 10 }}>
            {SHORTCUTS.map((s) => (
              <div
                key={s.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                }}
              >
                <span style={{ fontSize: 12 }}>{s.description}</span>
                <kbd
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18, textAlign: 'center' }}>
            <button className="button-outline" onClick={onClose} style={{ width: '100%' }}>
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Story } from '../lib/mockData';
import { audio } from '../lib/audio';

interface StoryViewerProps {
  story: Story;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  story,
  onClose,
  onNext,
  onPrev,
}) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sentNotice, setSentNotice] = useState<string | null>(null);
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (isPaused) return prev;
        if (prev >= 100) {
          clearInterval(interval);
          if (onNext) onNext();
          else onClose();
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && onNext) onNext();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [story.id, isPaused, onNext, onPrev, onClose]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSentNotice(`Reply sent to @${story.username}`);
    setReplyText('');
    setTimeout(() => setSentNotice(null), 2500);
  };

  const handleQuickReaction = () => {
    audio.playLikeSound();
    setShowHeartBurst(true);
    setSentNotice(`Sent ❤️ to @${story.username}`);
    setTimeout(() => setShowHeartBurst(false), 900);
    setTimeout(() => setSentNotice(null), 2500);
  };

  return (
    <div className="app-dialog open" role="dialog" aria-modal="true">
      <div
        className="app-dialog-card"
        style={{
          maxWidth: 440,
          background: '#0e1210',
          color: 'white',
          borderRadius: 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
        }}
      >
        {/* Progress Bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.25)', width: '100%' }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'white',
              transition: isPaused ? 'none' : 'width 0.1s linear',
            }}
          />
        </div>

        {/* Story Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src={story.avatar_url}
              alt={story.username}
              style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{story.username}</span>
                {isPaused && (
                  <span
                    style={{
                      fontSize: 9,
                      background: 'rgba(255,255,255,0.2)',
                      padding: '1px 5px',
                      borderRadius: 4,
                      textTransform: 'uppercase',
                    }}
                  >
                    Paused
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{story.created_at}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close story"
            style={{ color: 'white', fontSize: 18, padding: 4 }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Story Image Area with Hold-to-Pause */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 440,
            overflow: 'hidden',
            userSelect: 'none',
          }}
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <img
            src={story.story_image}
            alt={story.caption || 'Story'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {/* Navigation Click Zones */}
          {onPrev && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: '30%',
                cursor: 'pointer',
                background: 'transparent',
                border: 0,
              }}
              aria-label="Previous story"
            />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onNext) onNext();
              else onClose();
            }}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: '70%',
              cursor: 'pointer',
              background: 'transparent',
              border: 0,
            }}
            aria-label="Next story"
          />

          {/* Floating Heart Burst */}
          {showHeartBurst && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                pointerEvents: 'none',
                animation: 'likeAnimation 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
              }}
            >
              <i
                className="fa-solid fa-heart"
                style={{
                  fontSize: 84,
                  color: 'var(--accent)',
                  filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.5))',
                }}
              />
            </div>
          )}

          {/* Caption Overlay */}
          {story.caption && (
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                right: 12,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(8px)',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 13,
                color: 'white',
              }}
            >
              {story.caption}
            </div>
          )}
        </div>

        {/* Story Reply & Reaction Bar */}
        <div style={{ padding: '12px 14px', background: '#0e1210' }}>
          {sentNotice && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--mint)',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              {sentNotice}
            </div>
          )}

          <form
            onSubmit={handleSendReply}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${story.username}...`}
              style={{
                flex: 1,
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 99,
                padding: '8px 14px',
                fontSize: 12,
                background: 'rgba(255,255,255,0.06)',
                color: 'white',
                outline: 0,
              }}
            />
            {replyText.trim() ? (
              <button
                type="submit"
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'var(--accent)',
                  padding: '4px 8px',
                }}
              >
                Send
              </button>
            ) : (
              <button
                type="button"
                onClick={handleQuickReaction}
                aria-label="Send heart reaction"
                title="Send heart reaction"
                style={{
                  fontSize: 20,
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.2)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
              >
                <i className="fa-solid fa-heart" />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

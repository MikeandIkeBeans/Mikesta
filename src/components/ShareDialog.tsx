import React from 'react';
import { FeedPost } from '../lib/supabase';

interface ShareDialogProps {
  post: FeedPost;
  onClose: () => void;
  onCopyLink: () => void;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  post,
  onClose,
  onCopyLink,
}) => {
  return (
    <div className="app-dialog open" role="dialog" aria-modal="true">
      <div className="app-dialog-card" style={{ maxWidth: 420 }}>
        <div className="app-dialog-header">
          <div>
            <p className="kicker">Connect</p>
            <h2>Share moment</h2>
          </div>
          <button className="dialog-close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="app-dialog-body share-panel">
          <p>
            Share this moment by <strong>@{post.profiles?.username || 'creator'}</strong> with your network.
          </p>

          <div className="share-options">
            <button
              onClick={() => {
                onCopyLink();
                onClose();
              }}
            >
              <i className="fa-solid fa-link" />
              Copy link
            </button>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(
                  `Check out this photo by @${post.profiles?.username} on Mikesta: ${window.location.origin}/#post-${post.id}`
                );
                onCopyLink();
                onClose();
              }}
            >
              <i className="fa-regular fa-paper-plane" />
              Send direct
            </button>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Mikesta post by ${post.profiles?.username}`,
                    text: post.caption || 'Shared from Mikesta',
                    url: window.location.href,
                  }).catch(() => {});
                } else {
                  onCopyLink();
                }
                onClose();
              }}
            >
              <i className="fa-solid fa-share-nodes" />
              More apps
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

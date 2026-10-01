import React from 'react';
import { FeedPost, UserProfile } from '../lib/supabase';

interface PostOptionsDialogProps {
  post: FeedPost;
  currentUser: UserProfile | null;
  isFollowingAuthor: boolean;
  onClose: () => void;
  onCopyLink: () => void;
  onShare: () => void;
  onToggleFollow: () => void;
  onDeletePost: () => void;
}

export const PostOptionsDialog: React.FC<PostOptionsDialogProps> = ({
  post,
  currentUser,
  isFollowingAuthor,
  onClose,
  onCopyLink,
  onShare,
  onToggleFollow,
  onDeletePost,
}) => {
  const isOwner = currentUser?.id === post.user_id;

  return (
    <div className="app-dialog open" role="dialog" aria-modal="true">
      <div className="app-dialog-card" style={{ maxWidth: 360, padding: 0 }}>
        <div className="choice-list" style={{ padding: '12px 14px' }}>
          {isOwner ? (
            <button
              className="choice-item danger"
              onClick={() => {
                onDeletePost();
                onClose();
              }}
            >
              <i className="fa-regular fa-trash-can" style={{ marginRight: 10 }} />
              Delete moment
            </button>
          ) : (
            <button
              className="choice-item"
              onClick={() => {
                onToggleFollow();
                onClose();
              }}
            >
              <i
                className={`fa-solid ${isFollowingAuthor ? 'fa-user-minus' : 'fa-user-plus'}`}
                style={{ marginRight: 10 }}
              />
              {isFollowingAuthor ? `Unfollow @${post.profiles?.username}` : `Follow @${post.profiles?.username}`}
            </button>
          )}

          <button
            className="choice-item"
            onClick={() => {
              onCopyLink();
              onClose();
            }}
          >
            <i className="fa-solid fa-link" style={{ marginRight: 10 }} />
            Copy link
          </button>

          <button
            className="choice-item"
            onClick={() => {
              onShare();
              onClose();
            }}
          >
            <i className="fa-regular fa-paper-plane" style={{ marginRight: 10 }} />
            Share to circle
          </button>

          <button
            className="choice-item"
            onClick={onClose}
            style={{ color: 'var(--muted)', borderTop: '1px solid var(--line)', marginTop: 4 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

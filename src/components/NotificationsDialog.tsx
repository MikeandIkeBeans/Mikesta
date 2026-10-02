import React from 'react';
import { NotificationItem } from '../lib/socialTypes';

interface NotificationsDialogProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAllRead: () => void;
}

export const NotificationsDialog: React.FC<NotificationsDialogProps> = ({
  notifications,
  onClose,
  onMarkAllRead,
}) => {
  return (
    <div className="app-dialog open" role="dialog" aria-modal="true">
      <div className="app-dialog-card" style={{ maxWidth: 460 }}>
        <div className="app-dialog-header">
          <div>
            <p className="kicker">Activity</p>
            <h2>Notifications</h2>
          </div>
          <button className="dialog-close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="app-dialog-body">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button
              onClick={onMarkAllRead}
              style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}
            >
              Mark all as read
            </button>
          </div>

          <div className="notification-list">
            {notifications.map((item) => (
              <div
                className="notification-item"
                key={item.id}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: item.read ? 'transparent' : 'var(--mint)',
                  transition: 'background 0.2s',
                }}
              >
                <img src={item.user.avatar_url} alt={item.user.username} />
                <div style={{ flex: 1 }}>
                  <p>
                    <strong>{item.user.username}</strong>{' '}
                    {item.action === 'like' && 'liked '}
                    {item.action === 'comment' && 'commented on '}
                    {item.action === 'follow' && 'started following you'}
                    {item.action === 'save' && 'bookmarked '}
                    {item.target && <span style={{ color: 'var(--muted)' }}>{item.target}</span>}
                  </p>
                  <small>{item.time}</small>
                </div>
                {!item.read && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

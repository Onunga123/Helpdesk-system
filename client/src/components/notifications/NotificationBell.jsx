import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import API from '../../api/axios';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/notifications');
      setNotifications(data?.data || []);
      setUnreadCount(data?.unreadCount || 0);
    } catch (err) {
      console.error('[Notifications] Failed to load:', err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const markAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('[Notifications] Mark read failed:', err?.response?.data?.message || err.message);
    }
  };

  const markAllRead = async () => {
    try {
      await API.patch('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('[Notifications] Mark all read failed:', err?.response?.data?.message || err.message);
    }
  };

  return (
    <div className="notification-bell-wrap" ref={panelRef}>
      <button
        type="button"
        className="notification-bell-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      >
        <FiBell />
        {unreadCount > 0 ? (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        ) : null}
      </button>

      {open ? (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <strong>Notifications</strong>
            {unreadCount > 0 ? (
              <button type="button" className="notification-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            ) : null}
          </div>

          {loading && notifications.length === 0 ? (
            <p className="notification-empty">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="notification-empty">No notifications yet</p>
          ) : (
            <ul className="notification-list">
              {notifications.map((n) => (
                <li key={n._id} className={n.read ? 'notification-item read' : 'notification-item unread'}>
                  <div className="notification-item-body">
                    <p className="notification-title">{n.title}</p>
                    <p className="notification-message">{n.message}</p>
                    <span className="notification-time">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <div className="notification-item-actions">
                    {n.link ? (
                      <Link
                        to={n.link}
                        className="notification-view-link"
                        onClick={() => {
                          if (!n.read) markAsRead(n._id);
                          setOpen(false);
                        }}
                      >
                        View
                      </Link>
                    ) : null}
                    {!n.read ? (
                      <button type="button" onClick={() => markAsRead(n._id)}>
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default NotificationBell;

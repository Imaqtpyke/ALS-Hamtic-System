import React, { useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationsContext';
import { X } from 'lucide-react';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAllRead, removeNotification } = useNotifications();
  const [open, setOpen] = useState(false);

  const items = useMemo(() => notifications.slice(0, 10), [notifications]);

  return (
    <div className="relative">
      <button
        type="button"
        className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none relative"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markAllRead();
        }}
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full min-w-[18px]">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="px-4 py-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Notifications</span>
            {notifications.length > 0 && (
              <button className="text-xs text-blue-600 hover:underline" onClick={markAllRead}>
                Mark all as read
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-sm text-gray-500 text-center">No notifications</li>
            ) : (
              items.map((n) => (
                <li key={n.id} className={`px-4 py-3 text-sm flex items-start gap-2 ${n.read ? 'text-gray-600' : 'text-gray-800'}`}>
                  <div className="flex-1">
                    <p>{n.message}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <button
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    aria-label="Dismiss notification"
                    onClick={() => removeNotification(n.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

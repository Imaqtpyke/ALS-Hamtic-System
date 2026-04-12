import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { toast } from 'react-hot-toast';

export type AppNotification = {
  id: string;
  message: string;
  createdAt: string; // ISO string
  read: boolean;
};

type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => Promise<void>;
  addNotification: (n: AppNotification) => void;
  removeNotification: (id: string) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // Fetch notifications from Supabase
  const fetchNotifications = async () => {
    if (!user?.uid || !isSupabaseConfigured) return;

    // Firebase UIDs are NOT UUIDs. Supabase's notifications.user_id is uuid typed.
    // Guard: skip the query entirely if the uid doesn't match UUID v4 format.
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(user.uid)) {
      if (import.meta.env.DEV) {
        console.warn('[NotificationsContext] Skipping notifications fetch — user.uid is not a UUID:', user.uid);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        // Silently ignore 400 errors (table may not exist yet) and permission errors
        if (import.meta.env.DEV) {
          console.warn('[NotificationsContext] Notifications fetch skipped:', error.message);
        }
        return;
      }
      setNotifications(data.map(n => ({
        id: n.id,
        message: n.message,
        createdAt: n.created_at,
        read: n.is_read
      })));
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[NotificationsContext] Notifications fetch failed silently:', err);
      }
    }
  };

  const addNotification = (n: AppNotification) => {
    setNotifications(prev => [n, ...prev].slice(0, 20));
  };

  const markAllRead = async () => {
    if (!user?.uid || !isSupabaseConfigured) return;
    
    // Optimistic Update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.uid)
      .eq('is_read', false);

    if (error) {
       toast.error('Failed to sync notification status');
       fetchNotifications(); // Rollback/Resync
    }
  };

  const removeNotification = async (id: string) => {
    if (!user?.uid || !isSupabaseConfigured) return;
    
    // Optimistic Update
    setNotifications(prev => prev.filter(n => n.id !== id));

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
       toast.error('Failed to delete notification');
       fetchNotifications(); // Rollback/Resync
    }
  };

  // Real-time synchronization
  useEffect(() => {
    if (!user?.uid || !isSupabaseConfigured) return;

    fetchNotifications();

    const channel = supabase
      .channel(`user-notifications-${user.uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.uid}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newN: AppNotification = {
              id: payload.new.id,
              message: payload.new.message,
              createdAt: payload.new.created_at,
              read: payload.new.is_read
            };
            addNotification(newN);
            toast.success('New update received!', { icon: '🔔' });
          } else {
            fetchNotifications();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.uid]);

  const value = useMemo(() => ({ notifications, unreadCount, markAllRead, addNotification, removeNotification }), [notifications, unreadCount]);

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
};

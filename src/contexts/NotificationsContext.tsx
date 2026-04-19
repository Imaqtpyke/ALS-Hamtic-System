import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { toast } from 'react-hot-toast';

export type AppNotification = {
  id: string;
  title?: string;
  message: string;
  createdAt: string; // ISO string
  read: boolean;
  type?: 'generic' | 'admin_message';
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

  const fetchNotifications = async () => {
    if (!user?.uid || !isSupabaseConfigured) return;

    try {
      let allNotifications: AppNotification[] = [];

      // 1. Fetch from 'admin_messages' (supports Firebase UIDs - text column)
      const { data: mData } = await supabase
        .from('admin_messages')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false })
        .limit(30);

      if (mData) {
        allNotifications = mData.map(m => ({
          id: m.id,
          title: 'Message from Admin',
          message: m.message,
          createdAt: m.created_at,
          read: m.is_read,
          type: 'admin_message'
        }));
      }

      setNotifications(allNotifications);
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

    // Update admin_messages table
    await supabase
      .from('admin_messages')
      .update({ is_read: true })
      .eq('user_id', user.uid)
      .eq('is_read', false);

    // Resync anyway to be sure
    await fetchNotifications();
  };

  const removeNotification = async (id: string) => {
    if (!user?.uid || !isSupabaseConfigured) return;
    
    // Optimistic Update
    setNotifications(prev => prev.filter(n => n.id !== id));

    // Try deleting from both (one will likely fail or do nothing depending on current item type)
    await supabase.from('notifications').delete().eq('id', id);
    await supabase.from('admin_messages').delete().eq('id', id);

    // No hard error check here to keep it simple, fetchNotifications will resync if needed
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
          table: 'admin_messages',
          filter: `user_id=eq.${user.uid}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newM: AppNotification = {
              id: payload.new.id,
              title: 'Message from Admin',
              message: payload.new.message,
              createdAt: payload.new.created_at,
              read: payload.new.is_read,
              type: 'admin_message'
            };
            addNotification(newM);
            toast.success('New message from Admin!', { icon: '✉️' });
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

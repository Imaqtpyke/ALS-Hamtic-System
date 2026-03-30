import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

export type AppNotification = {
  id: string;
  message: string;
  createdAt: string; // ISO string
  read: boolean;
};

type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  addNotification: (n: AppNotification) => void;
  removeNotification: (id: string) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const addNotification = (n: AppNotification) => {
    setNotifications(prev => [n, ...prev].slice(0, 20));
  };

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const removeNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  // Subscribe to enrollment status updates for this user
  useEffect(() => {
    if (!user?.uid) return;

    let cancelled = false;

    // Fetch latest enrollment to seed an initial state (optional)
    const seed = async () => {
      const { data } = await supabase
        .from('enrollments')
        .select('id, status, submitted_at')
        .eq('user_id', user.uid)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data?.status && data?.status !== 'pending') {
        addNotification({
          id: `seed-${data.id}`,
          message: `Your application was ${data.status}.`,
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    };

    seed();

    const channel = supabase
      .channel(`enrollments-status-${user.uid}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'enrollments',
          filter: `user_id=eq.${user.uid}`,
        },
        (payload: any) => {
          const oldStatus = payload?.old?.status;
          const newStatus = payload?.new?.status;
          if (oldStatus && newStatus && oldStatus !== newStatus) {
            const msg = newStatus === 'approved'
              ? 'Good news! Your application has been approved.'
              : newStatus === 'rejected'
                ? 'Your application was rejected. Please check the reason and try again.'
                : `Your application status changed to ${newStatus}.`;
            addNotification({
              id: payload.new.id + ':' + payload.commit_timestamp,
              message: msg,
              createdAt: new Date().toISOString(),
              read: false,
            });
          }
        }
      )
      .subscribe(() => {
        // no-op
        return undefined;
      });

    return () => {
      cancelled = true;
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

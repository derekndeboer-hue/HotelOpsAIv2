import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/context/FirestoreContext';
import { useAuth } from '@/context/AuthContext';
import type { Notification } from '@/types';

export function useNotifications() {
  const { db } = useFirestore();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;

    const colPath = `hotels/${user.tenantId}_${user.hotelId}/notifications`;
    const q = query(
      collection(db, colPath),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
        setNotifications(data);
        setLoading(false);
      },
      err => {
        console.error('Notifications listener error:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [db, user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user || !db) return;
      const colPath = `hotels/${user.tenantId}_${user.hotelId}/notifications`;
      await updateDoc(doc(db, colPath, notificationId), { read: true });
    },
    [db, user]
  );

  return { notifications, unreadCount, loading, markAsRead };
}

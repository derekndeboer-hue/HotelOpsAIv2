import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/context/FirestoreContext';
import { useAuth } from '@/context/AuthContext';
import type { Alert } from '@/types';

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export function useAlerts() {
  const { db } = useFirestore();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const colPath = `hotels/${user.tenantId}_${user.hotelId}/alerts`;
    const q = query(
      collection(db, colPath),
      where('acknowledged', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Alert))
          .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
        setAlerts(data);
        setLoading(false);
      },
      err => {
        console.error('Alerts listener error:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [db, user]);

  return { alerts, loading };
}

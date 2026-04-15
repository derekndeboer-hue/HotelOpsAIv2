import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/context/FirestoreContext';
import { useAuth } from '@/context/AuthContext';
import type { Room } from '@/types';

export function useRoomBoard() {
  const { db } = useFirestore();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const colPath = `hotels/${user.tenantId}_${user.hotelId}/rooms`;
    const q = query(collection(db, colPath), orderBy('number'));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Room[];
        setRooms(data);
        setLoading(false);
        setError(null);
      },
      err => {
        console.error('Room board listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [db, user]);

  return { rooms, loading, error };
}

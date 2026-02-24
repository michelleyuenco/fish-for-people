import { useState, useEffect } from 'react';
import {
  onSnapshot,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirestoreDb } from '../../infrastructure/firebase/firebaseConfig';
import { activeConfigDoc } from '../../infrastructure/firebase/collections';

const TODAY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const DEFAULT_SERVICE_ID = `service-${TODAY}`;

export function useService() {
  const [serviceId, setServiceId] = useState<string>(DEFAULT_SERVICE_ID);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirestoreDb();
    const configDoc = activeConfigDoc(db);

    const unsubscribe = onSnapshot(
      configDoc,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setServiceId(data.serviceId || DEFAULT_SERVICE_ID);
        } else {
          // Create default service config
          await setDoc(configDoc, {
            serviceId: DEFAULT_SERVICE_ID,
            date: TODAY,
            createdAt: serverTimestamp(),
          });
          setServiceId(DEFAULT_SERVICE_ID);
        }
        setLoading(false);
      },
      () => {
        // On error, use default service ID
        setServiceId(DEFAULT_SERVICE_ID);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { serviceId, loading };
}

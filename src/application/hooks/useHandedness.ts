import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../../domain/constants/storageKeys';

export function useHandedness() {
  const [isLeftHanded, setIsLeftHanded] = useState(
    () => localStorage.getItem(STORAGE_KEYS.HANDEDNESS) === 'left'
  );

  useEffect(() => {
    const handler = () => setIsLeftHanded(localStorage.getItem(STORAGE_KEYS.HANDEDNESS) === 'left');
    window.addEventListener('handedness-change', handler);
    return () => window.removeEventListener('handedness-change', handler);
  }, []);

  return isLeftHanded;
}

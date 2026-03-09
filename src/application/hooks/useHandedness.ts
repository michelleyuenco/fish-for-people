import { useState, useEffect } from 'react';

const HANDEDNESS_KEY = 'fish-for-people:handedness';

export function useHandedness() {
  const [isLeftHanded, setIsLeftHanded] = useState(
    () => localStorage.getItem(HANDEDNESS_KEY) === 'left'
  );

  useEffect(() => {
    const handler = () => setIsLeftHanded(localStorage.getItem(HANDEDNESS_KEY) === 'left');
    window.addEventListener('handedness-change', handler);
    return () => window.removeEventListener('handedness-change', handler);
  }, []);

  return isLeftHanded;
}

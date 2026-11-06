import { useEffect, useState } from 'react';
import { seedInitialData } from '@/db/posDb';

export function useInitializeDb() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    seedInitialData()
      .then(() => {
        if (mounted) setIsReady(true);
      })
      .catch((err) => {
        console.error('Failed to initialize database:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Database initialization error');
          setIsReady(true); // Allow continuing anyway
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { isReady, error };
}
